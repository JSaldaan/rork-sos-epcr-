import { InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from "react";

/**
 * Performance optimization utilities for the RORK PCR App
 */

// Debounce function for reducing unnecessary function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for limiting function execution rate
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Batch async storage operations for better performance
export class BatchedStorage {
  private static pendingWrites: Map<string, any> = new Map();
  private static writeTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly BATCH_DELAY = 100; // ms

  static async setItem(key: string, value: string): Promise<void> {
    this.pendingWrites.set(key, value);
    this.scheduleBatchWrite();
  }

  private static scheduleBatchWrite() {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }
    
    this.writeTimer = setTimeout(() => {
      this.executeBatchWrite();
    }, this.BATCH_DELAY);
  }

  private static async executeBatchWrite() {
    if (this.pendingWrites.size === 0) return;
    
    const writes = Array.from(this.pendingWrites.entries());
    this.pendingWrites.clear();
    
    try {
      // Use multiSet for batch operations
      await AsyncStorage.multiSet(writes);
      console.log(`Batch wrote ${writes.length} items to storage`);
    } catch (error) {
      console.error('Batch write failed:', error);
      // Re-add failed writes to pending
      writes.forEach(([key, value]: [string, any]) => {
        this.pendingWrites.set(key, value);
      });
    }
  }

  static async getItem(key: string): Promise<string | null> {
    // Check pending writes first
    if (this.pendingWrites.has(key)) {
      return this.pendingWrites.get(key);
    }
    return AsyncStorage.getItem(key);
  }

  static async multiGet(keys: string[]): Promise<readonly [string, string | null][]> {
    // Include pending writes in the result
    const result = await AsyncStorage.multiGet(keys);
    return result.map(([key, value]: [string, string | null]) => {
      if (this.pendingWrites.has(key)) {
        return [key, this.pendingWrites.get(key)];
      }
      return [key, value];
    });
  }
}

// Memory cache for frequently accessed data
export class MemoryCache {
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
    
    // Clean up expired entries periodically
    this.scheduleCleanup();
  }

  static get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  static clear(): void {
    this.cache.clear();
  }

  private static cleanupTimer: ReturnType<typeof setTimeout> | null = null;
  
  private static scheduleCleanup(): void {
    if (this.cleanupTimer) return;
    
    this.cleanupTimer = setTimeout(() => {
      this.cleanup();
      this.cleanupTimer = null;
    }, 60000); // Run cleanup every minute
  }

  private static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp) {
        this.cache.delete(key);
      }
    }
  }
}

// Optimize heavy operations to run after interactions
export function runAfterInteractions<T>(
  operation: () => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      operation().then(resolve).catch(reject);
    });
  });
}

// Lazy load components for better initial load time
export function lazyWithPreload<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): {
  Component: React.LazyExoticComponent<T>;
  preload: () => Promise<void>;
} {
  let preloadedModule: { default: T } | null = null;
  
  const load = async () => {
    if (preloadedModule) return preloadedModule;
    preloadedModule = await importFunc();
    return preloadedModule;
  };
  
  return {
    Component: React.lazy(load),
    preload: async () => {
      await load();
    },
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  private static measures: Map<string, number[]> = new Map();

  static mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  static measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`No mark found for ${startMark}`);
      return 0;
    }
    
    const duration = performance.now() - start;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);
    
    // Keep only last 100 measurements
    const measurements = this.measures.get(name)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
    
    return duration;
  }

  static getAverageTime(measureName: string): number {
    const measurements = this.measures.get(measureName);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  static logPerformanceReport(): void {
    console.log('=== Performance Report ===');
    for (const [name, measurements] of this.measures.entries()) {
      if (measurements.length > 0) {
        const avg = this.getAverageTime(name);
        const min = Math.min(...measurements);
        const max = Math.max(...measurements);
        console.log(`${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
      }
    }
    console.log('=== End Performance Report ===');
  }

  static clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

// Optimize image loading
export function optimizeImageUri(uri: string, width?: number, height?: number): string {
  if (!uri || !uri.startsWith('http')) return uri;
  
  // Add image optimization parameters if supported by the server
  const url = new URL(uri);
  if (width) url.searchParams.set('w', width.toString());
  if (height) url.searchParams.set('h', height.toString());
  url.searchParams.set('q', '85'); // 85% quality for good balance
  
  return url.toString();
}

// Batch state updates
export class BatchedStateUpdater<T> {
  private pendingUpdates: Partial<T>[] = [];
  private updateTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly batchDelay: number;
  private readonly updateFunction: (updates: Partial<T>) => void;

  constructor(updateFunction: (updates: Partial<T>) => void, batchDelay: number = 50) {
    this.updateFunction = updateFunction;
    this.batchDelay = batchDelay;
  }

  update(updates: Partial<T>): void {
    this.pendingUpdates.push(updates);
    this.scheduleBatchUpdate();
  }

  private scheduleBatchUpdate(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    this.updateTimer = setTimeout(() => {
      this.executeBatchUpdate();
    }, this.batchDelay);
  }

  private executeBatchUpdate(): void {
    if (this.pendingUpdates.length === 0) return;
    
    // Merge all pending updates
    const mergedUpdates = this.pendingUpdates.reduce((acc, update) => {
      return { ...acc, ...update };
    }, {} as Partial<T>);
    
    this.pendingUpdates = [];
    this.updateFunction(mergedUpdates);
  }

  flush(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    this.executeBatchUpdate();
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const memoryCache = new MemoryCache();
export const batchedStorage = new BatchedStorage();
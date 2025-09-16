import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  PerformanceMonitor, 
  MemoryCache,
  BatchedStorage,
  debounce,
  throttle 
} from '@/utils/performanceOptimizer';
import { usePCRStore } from '@/store/pcrStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook for app-wide performance optimizations
 */
export function usePerformanceOptimization() {
  const appState = useRef(AppState.currentState);
  const { saveCurrentPCRDraft } = usePCRStore();

  // Monitor app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextAppState === 'background') {
        // App going to background - save state
        console.log('App going to background, saving state...');
        saveCurrentPCRDraft().catch(console.error);
        
        // Clear performance data to free memory
        PerformanceMonitor.clear();
        MemoryCache.clear();
      } else if (appState.current.match(/background/) && nextAppState === 'active') {
        // App coming to foreground
        console.log('App coming to foreground');
        
        // Preload critical data
        preloadCriticalData();
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [saveCurrentPCRDraft]);

  // Preload critical data for better performance
  const preloadCriticalData = useCallback(async () => {
    try {
      // Batch load frequently accessed data
      const keys = [
        'currentPCRDraft',
        'completedPCRs',
        'staffMembers',
        'currentSession'
      ];
      
      const results = await AsyncStorage.multiGet(keys);
      
      // Cache the results in memory
      results.forEach(([key, value]) => {
        if (value) {
          MemoryCache.set(key, value, 10 * 60 * 1000); // Cache for 10 minutes
        }
      });
      
      console.log('Critical data preloaded and cached');
    } catch (error) {
      console.error('Error preloading critical data:', error);
    }
  }, []);

  // Clean up old data periodically
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        // Clean up old audit logs
        const auditLogs = await AsyncStorage.getItem('admin_auditLogs');
        if (auditLogs) {
          const logs = JSON.parse(auditLogs);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentLogs = logs.filter((log: any) => {
            return new Date(log.timestamp) > thirtyDaysAgo;
          });
          
          if (recentLogs.length < logs.length) {
            await AsyncStorage.setItem('admin_auditLogs', JSON.stringify(recentLogs));
            console.log(`Cleaned up ${logs.length - recentLogs.length} old audit logs`);
          }
        }
        
        // Log performance metrics
        PerformanceMonitor.logPerformanceReport();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  // Optimize storage operations
  useEffect(() => {
    // Override AsyncStorage methods with batched versions for better performance
    const originalSetItem = AsyncStorage.setItem;
    const originalGetItem = AsyncStorage.getItem;
    
    // Create debounced save function
    const debouncedSave = debounce((key: string, value: string) => {
      originalSetItem.call(AsyncStorage, key, value).catch(console.error);
    }, 500);
    
    // Override setItem for non-critical data
    (AsyncStorage as any).setItemOptimized = (key: string, value: string) => {
      // Use immediate save for critical data
      if (key.includes('signature') || key.includes('vital') || key.includes('session')) {
        return originalSetItem.call(AsyncStorage, key, value);
      }
      // Use debounced save for other data
      debouncedSave(key, value);
      return Promise.resolve();
    };
    
    // Override getItem to use cache first
    (AsyncStorage as any).getItemOptimized = async (key: string) => {
      // Check memory cache first
      const cached = MemoryCache.get(key);
      if (cached !== null) {
        console.log(`Cache hit for ${key}`);
        return cached;
      }
      
      // Fall back to storage
      const value = await originalGetItem.call(AsyncStorage, key);
      if (value) {
        // Cache the value for future use
        MemoryCache.set(key, value);
      }
      return value;
    };
  }, []);

  // Monitor memory usage
  useEffect(() => {
    const memoryMonitor = setInterval(() => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
        
        console.log(`Memory: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`);
        
        // Warn if memory usage is high
        if (usedMB / limitMB > 0.8) {
          console.warn('High memory usage detected, consider clearing cache');
          MemoryCache.clear();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(memoryMonitor);
  }, []);

  return {
    preloadCriticalData,
    PerformanceMonitor,
    MemoryCache,
    BatchedStorage,
    debounce,
    throttle,
  };
}

/**
 * Hook for optimizing list rendering
 */
export function useOptimizedList<T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string
) {
  const getItemLayout = useCallback(
    (_data: T[] | null | undefined, index: number) => ({
      length: 80, // Estimated item height
      offset: 80 * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    (info: { item: T; index: number }) => {
      // Wrap in performance monitoring
      PerformanceMonitor.mark(`render-item-${info.index}`);
      return info;
    },
    []
  );

  return {
    data,
    keyExtractor,
    getItemLayout,
    renderItem,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    windowSize: 10,
    initialNumToRender: 10,
  };
}
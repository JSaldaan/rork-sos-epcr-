import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { CompletedPCR, StaffMember } from '@/store/types';
import { Platform } from 'react-native';
import React from 'react';

/**
 * Comprehensive offline management system for RORK PCR App
 * Handles data synchronization, offline detection, and local storage
 */

export interface OfflineQueueItem {
  id: string;
  type: 'PCR_SUBMIT' | 'STAFF_UPDATE' | 'DATA_SYNC' | 'ADMIN_ACTION';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface OfflineState {
  isOnline: boolean;
  lastSyncTime: string | null;
  queuedItems: OfflineQueueItem[];
  syncInProgress: boolean;
  dataVersion: number;
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsFailed: number;
  errors: string[];
  lastSyncTime: string;
}

class OfflineManager {
  private static instance: OfflineManager;
  private networkListener: any;
  private syncInterval: any;
  private state: OfflineState = {
    isOnline: true,
    lastSyncTime: null,
    queuedItems: [],
    syncInProgress: false,
    dataVersion: 1,
    storageUsage: {
      used: 0,
      available: 0,
      percentage: 0
    }
  };
  private listeners: ((state: OfflineState) => void)[] = [];

  private constructor() {
    this.initializeNetworkListener();
    this.loadOfflineState();
    this.startPeriodicSync();
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Initialize network connectivity monitoring
   */
  private async initializeNetworkListener() {
    try {
      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.updateOnlineStatus(netInfo.isConnected ?? false);

      // Listen for network changes
      this.networkListener = NetInfo.addEventListener(state => {
        console.log('Network state changed:', {
          isConnected: state.isConnected,
          type: state.type,
          isInternetReachable: state.isInternetReachable
        });
        this.updateOnlineStatus(state.isConnected ?? false);
      });

      console.log('Network listener initialized');
    } catch (error) {
      console.error('Failed to initialize network listener:', error);
      // Fallback to assuming online
      this.updateOnlineStatus(true);
    }
  }

  /**
   * Update online status and trigger sync if coming back online
   */
  private updateOnlineStatus(isOnline: boolean) {
    const wasOffline = !this.state.isOnline;
    this.state.isOnline = isOnline;
    
    console.log(`Network status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    
    // If coming back online and have queued items, start sync
    if (wasOffline && isOnline && this.state.queuedItems.length > 0) {
      console.log('Back online with queued items, starting sync...');
      setTimeout(() => this.syncQueuedItems(), 2000); // Wait 2s for stable connection
    }
    
    this.notifyListeners();
    this.saveOfflineState();
  }

  /**
   * Add item to offline queue
   */
  public async addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };

    this.state.queuedItems.push(queueItem);
    await this.saveOfflineState();
    
    console.log(`Added item to offline queue: ${queueItem.type} (${queueItem.id})`);
    
    // If online, try to process immediately
    if (this.state.isOnline && !this.state.syncInProgress) {
      setTimeout(() => this.syncQueuedItems(), 1000);
    }
    
    this.notifyListeners();
    return queueItem.id;
  }

  /**
   * Process all queued items
   */
  public async syncQueuedItems(): Promise<SyncResult> {
    if (this.state.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return {
        success: false,
        itemsProcessed: 0,
        itemsFailed: 0,
        errors: ['Sync already in progress'],
        lastSyncTime: this.state.lastSyncTime || new Date().toISOString()
      };
    }

    if (!this.state.isOnline) {
      console.log('Offline, cannot sync queued items');
      return {
        success: false,
        itemsProcessed: 0,
        itemsFailed: 0,
        errors: ['Device is offline'],
        lastSyncTime: this.state.lastSyncTime || new Date().toISOString()
      };
    }

    this.state.syncInProgress = true;
    this.notifyListeners();

    const result: SyncResult = {
      success: true,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: [],
      lastSyncTime: new Date().toISOString()
    };

    console.log(`Starting sync of ${this.state.queuedItems.length} queued items`);

    // Sort by priority and timestamp
    const sortedItems = [...this.state.queuedItems]
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

    for (const item of sortedItems) {
      try {
        console.log(`Processing queue item: ${item.type} (${item.id})`);
        item.status = 'processing';
        
        const success = await this.processQueueItem(item);
        
        if (success) {
          item.status = 'completed';
          result.itemsProcessed++;
          console.log(`✅ Successfully processed: ${item.type} (${item.id})`);
        } else {
          item.retryCount++;
          if (item.retryCount >= item.maxRetries) {
            item.status = 'failed';
            result.itemsFailed++;
            result.errors.push(`Max retries exceeded for ${item.type} (${item.id})`);
            console.log(`❌ Max retries exceeded: ${item.type} (${item.id})`);
          } else {
            item.status = 'pending';
            console.log(`⚠️ Retry ${item.retryCount}/${item.maxRetries}: ${item.type} (${item.id})`);
          }
        }
      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error);
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          item.status = 'failed';
          result.itemsFailed++;
          result.errors.push(`Error processing ${item.type}: ${error}`);
        } else {
          item.status = 'pending';
        }
      }
    }

    // Remove completed items
    this.state.queuedItems = this.state.queuedItems.filter(item => item.status !== 'completed');
    
    this.state.lastSyncTime = result.lastSyncTime;
    this.state.syncInProgress = false;
    
    await this.saveOfflineState();
    this.notifyListeners();

    console.log(`Sync completed: ${result.itemsProcessed} processed, ${result.itemsFailed} failed`);
    
    return result;
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: OfflineQueueItem): Promise<boolean> {
    // Lazy load store to avoid circular dependency
    const { usePCRStore } = await import('@/store/pcrStore');
    const store = usePCRStore.getState();
    
    try {
      switch (item.type) {
        case 'PCR_SUBMIT':
          // In a real app, this would sync with server
          // For now, just ensure it's in local storage
          const pcr = item.data as CompletedPCR;
          await store.storeComprehensiveAdminData(pcr);
          console.log(`PCR ${pcr.id} synced successfully`);
          return true;

        case 'STAFF_UPDATE':
          // Sync staff updates
          const staffUpdate = item.data as { corporationId: string; updates: Partial<StaffMember> };
          await store.updateStaffMember(staffUpdate.corporationId, staffUpdate.updates);
          console.log(`Staff update for ${staffUpdate.corporationId} synced`);
          return true;

        case 'DATA_SYNC':
          // Full data synchronization
          await this.performFullDataSync();
          return true;

        case 'ADMIN_ACTION':
          // Process admin actions
          const adminAction = item.data as { action: string; payload: any };
          await this.processAdminAction(adminAction);
          return true;

        default:
          console.warn(`Unknown queue item type: ${item.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to process queue item ${item.id}:`, error);
      return false;
    }
  }

  /**
   * Perform full data synchronization
   */
  private async performFullDataSync(): Promise<void> {
    console.log('Performing full data sync...');
    // Lazy load store to avoid circular dependency
    const { usePCRStore } = await import('@/store/pcrStore');
    const store = usePCRStore.getState();
    
    try {
      // Load all data from storage
      await store.loadCompletedPCRs();
      await store.loadStaffMembers();
      await store.loadAdminData();
      
      // Update data version
      this.state.dataVersion++;
      
      console.log('Full data sync completed');
    } catch (error) {
      console.error('Full data sync failed:', error);
      throw error;
    }
  }

  /**
   * Process admin actions
   */
  private async processAdminAction(action: { action: string; payload: any }): Promise<void> {
    // Lazy load store to avoid circular dependency
    const { usePCRStore } = await import('@/store/pcrStore');
    const store = usePCRStore.getState();
    
    switch (action.action) {
      case 'UPDATE_STAFF_ROLE':
        await store.updateStaffRole(action.payload.corporationId, action.payload.newRole);
        break;
      case 'DEACTIVATE_STAFF':
        await store.deactivateStaff(action.payload.corporationId);
        break;
      case 'REACTIVATE_STAFF':
        await store.reactivateStaff(action.payload.corporationId);
        break;
      default:
        console.warn(`Unknown admin action: ${action.action}`);
    }
  }

  /**
   * Start periodic sync (every 5 minutes when online)
   */
  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (this.state.isOnline && this.state.queuedItems.length > 0 && !this.state.syncInProgress) {
        console.log('Periodic sync triggered');
        this.syncQueuedItems();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Calculate storage usage
   */
  public async calculateStorageUsage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      // Estimate available storage (this is approximate)
      const estimatedAvailable = Platform.OS === 'web' ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB web, 100MB mobile
      const percentage = (totalSize / estimatedAvailable) * 100;
      
      this.state.storageUsage = {
        used: totalSize,
        available: estimatedAvailable - totalSize,
        percentage: Math.min(percentage, 100)
      };
      
      console.log('Storage usage calculated:', {
        used: `${(totalSize / 1024).toFixed(2)} KB`,
        percentage: `${percentage.toFixed(1)}%`
      });
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }
  }

  /**
   * Clean up old data to free storage
   */
  public async cleanupOldData(daysToKeep: number = 30): Promise<number> {
    console.log(`Cleaning up data older than ${daysToKeep} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let itemsRemoved = 0;
    
    try {
      // Clean up old completed queue items
      const initialQueueLength = this.state.queuedItems.length;
      this.state.queuedItems = this.state.queuedItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        const shouldKeep = itemDate > cutoffDate || item.status === 'pending';
        if (!shouldKeep) itemsRemoved++;
        return shouldKeep;
      });
      
      console.log(`Removed ${initialQueueLength - this.state.queuedItems.length} old queue items`);
      
      // Clean up old audit logs
      // Lazy load store to avoid circular dependency
      const { usePCRStore } = await import('@/store/pcrStore');
      const store = usePCRStore.getState();
      const oldAuditCount = store.auditLogs.length;
      const recentAuditLogs = store.auditLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate > cutoffDate;
      });
      
      if (recentAuditLogs.length < oldAuditCount) {
        await AsyncStorage.setItem('admin_auditLogs', JSON.stringify(recentAuditLogs));
        itemsRemoved += oldAuditCount - recentAuditLogs.length;
        console.log(`Removed ${oldAuditCount - recentAuditLogs.length} old audit logs`);
      }
      
      await this.saveOfflineState();
      await this.calculateStorageUsage();
      
      console.log(`Cleanup completed: ${itemsRemoved} items removed`);
      return itemsRemoved;
    } catch (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Export all offline data for backup
   */
  public async exportOfflineData(): Promise<string> {
    console.log('Exporting offline data...');
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data: Record<string, any> = {};
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value; // Keep as string if not JSON
          }
        }
      }
      
      const exportData = {
        exportDate: new Date().toISOString(),
        version: this.state.dataVersion,
        platform: Platform.OS,
        offlineState: this.state,
        data
      };
      
      const exportString = JSON.stringify(exportData, null, 2);
      console.log(`Offline data exported: ${(exportString.length / 1024).toFixed(2)} KB`);
      
      return exportString;
    } catch (error) {
      console.error('Failed to export offline data:', error);
      throw error;
    }
  }

  /**
   * Import offline data from backup
   */
  public async importOfflineData(importData: string): Promise<boolean> {
    console.log('Importing offline data...');
    
    try {
      const parsed = JSON.parse(importData);
      
      if (!parsed.data || !parsed.version) {
        throw new Error('Invalid import data format');
      }
      
      // Clear existing data
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      
      // Import new data
      for (const [key, value] of Object.entries(parsed.data)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        await AsyncStorage.setItem(key, stringValue);
      }
      
      // Update state
      this.state.dataVersion = parsed.version;
      if (parsed.offlineState) {
        this.state.queuedItems = parsed.offlineState.queuedItems || [];
        this.state.lastSyncTime = parsed.offlineState.lastSyncTime;
      }
      
      await this.saveOfflineState();
      await this.calculateStorageUsage();
      
      // Reload store data
      // Lazy load store to avoid circular dependency
      const { usePCRStore } = await import('@/store/pcrStore');
      const store = usePCRStore.getState();
      await store.loadCompletedPCRs();
      await store.loadStaffMembers();
      await store.loadAdminData();
      
      console.log('Offline data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import offline data:', error);
      return false;
    }
  }

  /**
   * Get current offline state
   */
  public getState(): OfflineState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Error in offline state listener:', error);
      }
    });
  }

  /**
   * Save offline state to storage
   */
  private async saveOfflineState() {
    try {
      await AsyncStorage.setItem('offlineManagerState', JSON.stringify({
        lastSyncTime: this.state.lastSyncTime,
        queuedItems: this.state.queuedItems,
        dataVersion: this.state.dataVersion
      }));
    } catch (error) {
      console.error('Failed to save offline state:', error);
    }
  }

  /**
   * Load offline state from storage
   */
  private async loadOfflineState() {
    try {
      const stored = await AsyncStorage.getItem('offlineManagerState');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state.lastSyncTime = parsed.lastSyncTime;
        this.state.queuedItems = parsed.queuedItems || [];
        this.state.dataVersion = parsed.dataVersion || 1;
        console.log(`Loaded offline state: ${this.state.queuedItems.length} queued items`);
      }
    } catch (error) {
      console.error('Failed to load offline state:', error);
    }
  }

  /**
   * Force sync now (manual trigger)
   */
  public async forceSyncNow(): Promise<SyncResult> {
    console.log('Force sync triggered by user');
    return await this.syncQueuedItems();
  }

  /**
   * Clear all queued items (emergency reset)
   */
  public async clearQueue(): Promise<void> {
    console.log('Clearing offline queue...');
    this.state.queuedItems = [];
    await this.saveOfflineState();
    this.notifyListeners();
    console.log('Offline queue cleared');
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  } {
    const stats = {
      total: this.state.queuedItems.length,
      pending: 0,
      processing: 0,
      failed: 0,
      completed: 0
    };
    
    this.state.queuedItems.forEach(item => {
      stats[item.status]++;
    });
    
    return stats;
  }

  /**
   * Cleanup resources
   */
  public destroy() {
    if (this.networkListener) {
      this.networkListener();
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners = [];
    console.log('OfflineManager destroyed');
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();

// React hook for using offline manager
export function useOfflineManager() {
  const [state, setState] = React.useState<OfflineState>(offlineManager.getState());
  
  React.useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setState);
    // Calculate storage usage on mount
    offlineManager.calculateStorageUsage();
    return unsubscribe;
  }, []);
  
  return {
    ...state,
    addToQueue: offlineManager.addToQueue.bind(offlineManager),
    syncNow: offlineManager.forceSyncNow.bind(offlineManager),
    clearQueue: offlineManager.clearQueue.bind(offlineManager),
    getQueueStats: offlineManager.getQueueStats.bind(offlineManager),
    exportData: offlineManager.exportOfflineData.bind(offlineManager),
    importData: offlineManager.importOfflineData.bind(offlineManager),
    cleanupOldData: offlineManager.cleanupOldData.bind(offlineManager)
  };
}

// Helper functions for common offline operations
export async function submitPCROffline(pcr: CompletedPCR): Promise<string> {
  return await offlineManager.addToQueue({
    type: 'PCR_SUBMIT',
    data: pcr,
    maxRetries: 3,
    priority: 'high'
  });
}

export async function updateStaffOffline(corporationId: string, updates: Partial<StaffMember>): Promise<string> {
  return await offlineManager.addToQueue({
    type: 'STAFF_UPDATE',
    data: { corporationId, updates },
    maxRetries: 2,
    priority: 'medium'
  });
}

export async function performAdminActionOffline(action: string, payload: any): Promise<string> {
  return await offlineManager.addToQueue({
    type: 'ADMIN_ACTION',
    data: { action, payload },
    maxRetries: 2,
    priority: 'medium'
  });
}

export async function scheduleDataSyncOffline(): Promise<string> {
  return await offlineManager.addToQueue({
    type: 'DATA_SYNC',
    data: {},
    maxRetries: 1,
    priority: 'low'
  });
}
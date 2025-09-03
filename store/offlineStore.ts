import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineAction {
  id: string;
  type: 'SUBMIT_PCR' | 'UPDATE_STAFF' | 'DELETE_PCR' | 'ADD_STAFF' | 'SYNC_DATA';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface OfflineStore {
  isOnline: boolean;
  isInitialized: boolean;
  pendingActions: OfflineAction[];
  lastSyncTime: string | null;
  syncInProgress: boolean;
  offlineDataVersion: number;
  
  // Actions
  initialize: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  addPendingAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'status'>) => Promise<void>;
  removePendingAction: (actionId: string) => Promise<void>;
  processPendingActions: () => Promise<void>;
  syncData: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  getOfflineDataSize: () => Promise<number>;
  exportOfflineData: () => Promise<string>;
  importOfflineData: (data: string) => Promise<void>;
}

const STORAGE_KEYS = {
  PENDING_ACTIONS: 'offline_pending_actions',
  LAST_SYNC: 'offline_last_sync',
  DATA_VERSION: 'offline_data_version',
  OFFLINE_CACHE: 'offline_cache',
};

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  isOnline: true,
  isInitialized: false,
  pendingActions: [],
  lastSyncTime: null,
  syncInProgress: false,
  offlineDataVersion: 1,

  initialize: async () => {
    try {
      console.log('=== INITIALIZING OFFLINE STORE ===');
      
      // Load pending actions
      const storedActions = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
      const pendingActions = storedActions ? JSON.parse(storedActions) : [];
      
      // Load last sync time
      const lastSyncTime = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      
      // Load data version
      const dataVersionStr = await AsyncStorage.getItem(STORAGE_KEYS.DATA_VERSION);
      const offlineDataVersion = dataVersionStr ? parseInt(dataVersionStr) : 1;
      
      // Set up network listener
      const unsubscribe = NetInfo.addEventListener(state => {
        const isOnline = Boolean(state.isConnected && state.isInternetReachable);
        console.log('Network status changed:', isOnline ? 'ONLINE' : 'OFFLINE');
        get().setOnlineStatus(isOnline);
        
        // Process pending actions when coming back online
        if (isOnline && get().pendingActions.length > 0) {
          console.log('Back online, processing pending actions...');
          setTimeout(() => {
            get().processPendingActions();
          }, 1000);
        }
      });
      
      // Get initial network state
      const networkState = await NetInfo.fetch();
      const isOnline = Boolean(networkState.isConnected && networkState.isInternetReachable);
      
      set({
        isOnline,
        isInitialized: true,
        pendingActions,
        lastSyncTime,
        offlineDataVersion,
      });
      
      console.log('Offline store initialized:', {
        isOnline,
        pendingActions: pendingActions.length,
        lastSyncTime,
        dataVersion: offlineDataVersion
      });
      console.log('=== END INITIALIZING OFFLINE STORE ===');
      
      // Store unsubscribe function for cleanup
      (get() as any)._networkUnsubscribe = unsubscribe;
      
    } catch (error) {
      console.error('Error initializing offline store:', error);
      set({ isInitialized: true, isOnline: false });
    }
  },

  setOnlineStatus: (isOnline: boolean) => {
    const currentStatus = get().isOnline;
    if (currentStatus !== isOnline) {
      set({ isOnline });
      console.log(`Network status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      if (isOnline) {
        // Show online indicator
        console.log('✅ Connected to internet');
      } else {
        // Show offline indicator
        console.log('🔴 Working offline - data will sync when connection is restored');
      }
    }
  },

  addPendingAction: async (actionData: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'status'>) => {
    const action: OfflineAction = {
      ...actionData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };
    
    const currentActions = get().pendingActions;
    const updatedActions = [...currentActions, action];
    
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(updatedActions));
    set({ pendingActions: updatedActions });
    
    console.log('Added pending action:', action.type, action.id);
    
    // Try to process immediately if online
    if (get().isOnline) {
      setTimeout(() => {
        get().processPendingActions();
      }, 100);
    }
  },

  removePendingAction: async (actionId: string) => {
    const currentActions = get().pendingActions;
    const updatedActions = currentActions.filter(action => action.id !== actionId);
    
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(updatedActions));
    set({ pendingActions: updatedActions });
    
    console.log('Removed pending action:', actionId);
  },

  processPendingActions: async () => {
    const { isOnline, pendingActions, syncInProgress } = get();
    
    if (!isOnline || syncInProgress || pendingActions.length === 0) {
      return;
    }
    
    set({ syncInProgress: true });
    console.log('Processing', pendingActions.length, 'pending actions...');
    
    for (const action of pendingActions) {
      if (action.status === 'completed') continue;
      
      try {
        console.log('Processing action:', action.type, action.id);
        
        // Simulate processing different action types
        switch (action.type) {
          case 'SUBMIT_PCR':
            // In a real app, this would sync with server
            console.log('Syncing PCR submission:', action.data.id);
            break;
          case 'UPDATE_STAFF':
            console.log('Syncing staff update:', action.data.corporationId);
            break;
          case 'DELETE_PCR':
            console.log('Syncing PCR deletion:', action.data.id);
            break;
          case 'ADD_STAFF':
            console.log('Syncing new staff member:', action.data.corporationId);
            break;
          default:
            console.log('Unknown action type:', action.type);
        }
        
        // Mark as completed
        await get().removePendingAction(action.id);
        console.log('✅ Action completed:', action.type, action.id);
        
      } catch (error) {
        console.error('❌ Error processing action:', action.type, error);
        
        // Update retry count
        const updatedActions = get().pendingActions.map(a => 
          a.id === action.id 
            ? { ...a, retryCount: a.retryCount + 1, status: (a.retryCount >= a.maxRetries ? 'failed' : 'pending') as 'pending' | 'completed' | 'failed' }
            : a
        );
        
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(updatedActions));
        set({ pendingActions: updatedActions });
      }
    }
    
    // Update last sync time
    const now = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
    set({ lastSyncTime: now, syncInProgress: false });
    
    console.log('✅ Finished processing pending actions');
  },

  syncData: async () => {
    console.log('🔄 Starting data sync...');
    await get().processPendingActions();
    
    // Update data version
    const newVersion = get().offlineDataVersion + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.DATA_VERSION, newVersion.toString());
    set({ offlineDataVersion: newVersion });
    
    console.log('✅ Data sync completed, version:', newVersion);
  },

  clearOfflineData: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.PENDING_ACTIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
        AsyncStorage.removeItem(STORAGE_KEYS.DATA_VERSION),
        AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_CACHE),
      ]);
      
      set({
        pendingActions: [],
        lastSyncTime: null,
        offlineDataVersion: 1,
      });
      
      console.log('✅ Offline data cleared');
    } catch (error) {
      console.error('❌ Error clearing offline data:', error);
    }
  },

  getOfflineDataSize: async (): Promise<number> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating offline data size:', error);
      return 0;
    }
  },

  exportOfflineData: async (): Promise<string> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data: Record<string, string | null> = {};
      
      for (const key of keys) {
        data[key] = await AsyncStorage.getItem(key);
      }
      
      const exportData = {
        version: get().offlineDataVersion,
        exportTime: new Date().toISOString(),
        data,
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting offline data:', error);
      throw error;
    }
  },

  importOfflineData: async (importDataStr: string) => {
    try {
      const importData = JSON.parse(importDataStr);
      
      if (!importData.data || !importData.version) {
        throw new Error('Invalid import data format');
      }
      
      // Clear existing data
      await AsyncStorage.clear();
      
      // Import all data
      for (const [key, value] of Object.entries(importData.data)) {
        if (value !== null) {
          await AsyncStorage.setItem(key, value as string);
        }
      }
      
      // Reinitialize store
      await get().initialize();
      
      console.log('✅ Offline data imported successfully');
    } catch (error) {
      console.error('❌ Error importing offline data:', error);
      throw error;
    }
  },
}));
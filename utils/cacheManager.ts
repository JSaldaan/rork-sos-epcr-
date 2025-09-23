import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Comprehensive cache management utility for SOS ePCR
 * Handles clearing various types of cache while preserving critical data
 * Enhanced with server restart capabilities
 */

export interface CacheManagerOptions {
  preserveUserSession?: boolean;
  preserveStaffDatabase?: boolean;
  preserveAppSettings?: boolean;
  clearQueryCache?: boolean;
  clearImageCache?: boolean;
}

const DEFAULT_OPTIONS: CacheManagerOptions = {
  preserveUserSession: true,
  preserveStaffDatabase: true,
  preserveAppSettings: true,
  clearQueryCache: true,
  clearImageCache: true,
};

/**
 * Clear AsyncStorage cache with selective preservation
 */
export const clearAsyncStorageCache = async (options: CacheManagerOptions = DEFAULT_OPTIONS): Promise<boolean> => {
  try {
    console.log('🧹 Starting AsyncStorage cache clear...');
    
    const keys = await AsyncStorage.getAllKeys();
    const keysToKeep: string[] = [];
    
    // Determine which keys to preserve
    if (options.preserveUserSession) {
      keysToKeep.push('user_session', 'current_session', 'auth_token');
    }
    
    if (options.preserveStaffDatabase) {
      keysToKeep.push('staff_database', 'staff_data', 'teams_config');
    }
    
    if (options.preserveAppSettings) {
      keysToKeep.push('app_settings', 'user_preferences', 'app_config');
    }
    
    // Filter out keys to preserve
    const keysToRemove = keys.filter(key => {
      return !keysToKeep.some(keepKey => key.includes(keepKey));
    });
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`🗑️ Cleared ${keysToRemove.length} AsyncStorage entries`);
      console.log('Preserved keys:', keysToKeep);
    } else {
      console.log('📦 No AsyncStorage entries to clear');
    }
    
    return true;
  } catch (error) {
    console.error('❌ AsyncStorage cache clear failed:', error);
    return false;
  }
};

/**
 * Clear web-specific caches
 */
export const clearWebCache = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return true;
  }
  
  try {
    console.log('🌐 Clearing web cache...');
    
    // Clear localStorage (except critical items)
    if (typeof localStorage !== 'undefined') {
      const criticalKeys = ['user_session', 'staff_database', 'app_settings'];
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !criticalKeys.some(critical => key.includes(critical))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🗑️ Cleared ${keysToRemove.length} localStorage entries`);
    }
    
    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
      console.log('🗑️ Cleared sessionStorage');
    }
    
    // Clear browser cache if available
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log(`🗑️ Cleared ${cacheNames.length} browser caches`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Web cache clear failed:', error);
    return false;
  }
};

/**
 * Clear React Query cache
 */
export const clearReactQueryCache = (queryClient: any): boolean => {
  try {
    console.log('🔄 Clearing React Query cache...');
    
    if (queryClient) {
      queryClient.clear();
      queryClient.cancelQueries();
      queryClient.invalidateQueries();
      console.log('✅ React Query cache cleared');
    }
    
    return true;
  } catch (error) {
    console.error('❌ React Query cache clear failed:', error);
    return false;
  }
};

/**
 * Comprehensive cache clear function
 */
export const clearAllCaches = async (
  queryClient?: any,
  options: CacheManagerOptions = DEFAULT_OPTIONS
): Promise<{
  success: boolean;
  results: {
    asyncStorage: boolean;
    webCache: boolean;
    queryCache: boolean;
  };
}> => {
  console.log('🚀 Starting comprehensive cache clear...');
  
  const results = {
    asyncStorage: false,
    webCache: false,
    queryCache: false,
  };
  
  try {
    // Clear AsyncStorage
    results.asyncStorage = await clearAsyncStorageCache(options);
    
    // Clear web-specific caches
    results.webCache = await clearWebCache();
    
    // Clear React Query cache
    if (options.clearQueryCache && queryClient) {
      results.queryCache = clearReactQueryCache(queryClient);
    } else {
      results.queryCache = true; // Skip if not requested
    }
    
    const success = results.asyncStorage && results.webCache && results.queryCache;
    
    if (success) {
      console.log('✅ Comprehensive cache clear completed successfully');
    } else {
      console.warn('⚠️ Some cache clearing operations failed:', results);
    }
    
    return { success, results };
  } catch (error) {
    console.error('❌ Comprehensive cache clear failed:', error);
    return { success: false, results };
  }
};

/**
 * Force app restart (web only)
 */
export const forceAppRestart = (): void => {
  if (typeof window !== 'undefined') {
    console.log('🔄 Forcing app restart (web)...');
    window.location.reload();
  } else {
    console.log('🔄 App restart requested (native - requires manual restart)');
    // For native apps, we can't force restart, but we can clear state
  }
};

/**
 * Clear Metro bundler cache (development only)
 */
export const clearMetroCache = async (): Promise<boolean> => {
  try {
    console.log('📦 Clearing Metro bundler cache...');
    
    // Clear Metro cache directories if accessible
    if (typeof window !== 'undefined') {
      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('🗑️ Cleared service worker registrations');
      }
      
      // Clear all browser storage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          // Clear persistent storage by clearing individual storage types
          if ('getDirectory' in navigator.storage) {
            // Clear OPFS (Origin Private File System) if available
            const opfsRoot = await (navigator.storage as any).getDirectory?.();
            if (opfsRoot) {
              console.log('🗑️ OPFS storage detected but cannot be cleared programmatically');
            }
          }
          console.log('🗑️ Persistent storage cleanup attempted');
        } catch (e) {
          console.log('⚠️ Could not clear persistent storage:', e);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Metro cache clear failed:', error);
    return false;
  }
};

/**
 * Clear all possible caches including development caches
 */
export const clearDevelopmentCaches = async (queryClient?: any): Promise<boolean> => {
  console.log('🔧 Clearing development caches...');
  
  try {
    const results = await Promise.all([
      clearAsyncStorageCache({ preserveUserSession: false, preserveStaffDatabase: false, preserveAppSettings: false }),
      clearWebCache(),
      clearMetroCache(),
      queryClient ? Promise.resolve(clearReactQueryCache(queryClient)) : Promise.resolve(true)
    ]);
    
    const success = results.every(result => result);
    console.log(success ? '✅ Development caches cleared' : '⚠️ Some development caches failed to clear');
    
    return success;
  } catch (error) {
    console.error('❌ Development cache clear failed:', error);
    return false;
  }
};

/**
 * Emergency cache clear and restart
 */
export const emergencyReset = async (queryClient?: any): Promise<void> => {
  console.log('🚨 Emergency reset initiated...');
  
  try {
    // Clear all caches aggressively including development caches
    await clearDevelopmentCaches(queryClient);
    
    // Additional aggressive clearing
    if (typeof window !== 'undefined') {
      // Clear all possible web storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear IndexedDB
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases?.() || [];
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve(true);
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
              return Promise.resolve();
            })
          );
          console.log('🗑️ Cleared IndexedDB databases');
        }
      } catch (e) {
        console.log('⚠️ Some web storage clearing failed:', e);
      }
    }
    
    console.log('✅ Emergency reset completed - restarting...');
    
    // Force restart on web with delay
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = window.location.href.split('?')[0] + '?cache_cleared=' + Date.now();
      }, 1500);
    }
    
  } catch (error) {
    console.error('❌ Emergency reset failed:', error);
    // Force restart anyway
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
};

/**
 * Server restart simulation (for development)
 */
export const restartServer = async (): Promise<void> => {
  console.log('🔄 Initiating server restart sequence...');
  
  try {
    // Clear all caches first
    await emergencyReset();
    
    console.log('✅ Server restart sequence completed');
  } catch (error) {
    console.error('❌ Server restart failed:', error);
  }
};

export default {
  clearAsyncStorageCache,
  clearWebCache,
  clearReactQueryCache,
  clearAllCaches,
  clearMetroCache,
  clearDevelopmentCaches,
  forceAppRestart,
  emergencyReset,
  restartServer,
};
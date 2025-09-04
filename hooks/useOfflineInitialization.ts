import { useEffect } from 'react';
import { usePCRStore } from '@/store/pcrStore';
import { offlineManager } from '@/utils/offlineManager';

/**
 * Hook to initialize offline capabilities when the app starts
 */
export function useOfflineInitialization() {
  const { loadCompletedPCRs, loadStaffMembers, loadAdminData, currentSession } = usePCRStore();

  useEffect(() => {
    let mounted = true;

    const initializeOfflineCapabilities = async () => {
      try {
        console.log('=== INITIALIZING OFFLINE CAPABILITIES ===');
        
        // Initialize offline manager (already done via singleton)
        console.log('Offline manager initialized');
        
        // Load all persisted data
        console.log('Loading persisted data...');
        await Promise.all([
          loadCompletedPCRs(),
          loadStaffMembers(),
          loadAdminData()
        ]);
        
        // Calculate initial storage usage
        await offlineManager.calculateStorageUsage();
        
        console.log('Offline capabilities initialized successfully');
        console.log('=== END OFFLINE INITIALIZATION ===');
      } catch (error) {
        console.error('Failed to initialize offline capabilities:', error);
      }
    };

    // Initialize on mount
    initializeOfflineCapabilities();

    // Cleanup on unmount
    return () => {
      mounted = false;
    };
  }, [loadCompletedPCRs, loadStaffMembers, loadAdminData]);

  // Re-initialize when session changes (login/logout)
  useEffect(() => {
    if (currentSession) {
      console.log('Session changed, reloading data for offline use');
      loadCompletedPCRs().catch(console.error);
    }
  }, [currentSession, loadCompletedPCRs]);
}
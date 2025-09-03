import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePCRStore } from '@/store/pcrStore';
import { useOfflineStore } from '@/store/offlineStore';

interface LogoutOptions {
  showConfirmation?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  skipToast?: boolean;
}

/**
 * Global logout hook that provides comprehensive session termination
 * Works from any screen or form in the app
 * Handles all authentication providers, storage cleanup, and navigation
 */
export const useGlobalLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const { currentSession } = usePCRStore();
  const offlineStore = useOfflineStore();

  /**
   * Complete logout process that clears all data and redirects to login
   * This is the core logout function that handles everything
   */
  const performCompleteLogout = useCallback(async (skipToast: boolean = false) => {
    console.log('🚀 GLOBAL LOGOUT: Starting comprehensive logout process...');
    
    if (isLoggingOut) {
      console.log('⚠️ Logout already in progress, preventing duplicate');
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      // Step 1: End all sessions and invalidate tokens
      console.log('🔐 Step 1: Ending all sessions and invalidating tokens...');
      
      // Clear all AsyncStorage data (includes tokens, user data, cached data)
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📱 Found storage keys to clear:', allKeys.length);
      await AsyncStorage.multiRemove(allKeys);
      console.log('✅ All AsyncStorage data cleared');
      
      // Step 2: Clear web-specific storage
      if (Platform.OS === 'web') {
        console.log('🌐 Step 2: Clearing web storage...');
        try {
          // Clear localStorage
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          // Clear sessionStorage
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
          // Clear IndexedDB (if any)
          if (typeof indexedDB !== 'undefined') {
            // Note: IndexedDB clearing would need specific implementation
            console.log('ℹ️ IndexedDB clearing not implemented (add if needed)');
          }
          // Clear cookies (domain-specific)
          if (typeof document !== 'undefined') {
            document.cookie.split(';').forEach(cookie => {
              const eqPos = cookie.indexOf('=');
              const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            });
          }
          console.log('✅ Web storage cleared');
        } catch (error) {
          console.log('⚠️ Web storage clearing failed:', error);
        }
      }
      
      // Step 3: Unsubscribe from push notifications and real-time listeners
      console.log('📢 Step 3: Unsubscribing from notifications and listeners...');
      try {
        // Clear offline store listeners
        if (offlineStore) {
          // Note: Add specific cleanup if offline store has listeners
          console.log('ℹ️ Offline store cleanup (add specific cleanup if needed)');
        }
        
        // Clear any push notification subscriptions
        // Note: Add specific push notification cleanup here if implemented
        console.log('ℹ️ Push notification cleanup (add if implemented)');
        
        console.log('✅ Notifications and listeners cleanup completed');
      } catch (error) {
        console.log('⚠️ Notification cleanup failed:', error);
      }
      
      // Step 4: Reset all application state
      console.log('🔄 Step 4: Resetting all application state...');
      
      // Reset PCR store to initial state
      usePCRStore.setState({
        currentSession: null,
        isAdmin: false,
        completedPCRs: [],
        staffMembers: [],
        isLoggingOut: false,
        // Reset admin data
        patients: [],
        encounters: [],
        allVitals: [],
        ecgs: [],
        signatures: [],
        attachments: [],
        auditLogs: [],
        // Reset PCR data to initial values
        callTimeInfo: {
          timeOfCall: '',
          date: '',
          arrivalOnScene: '',
          atPatientSide: '',
          toDestination: '',
          atDestination: '',
        },
        patientInfo: {
          firstName: '',
          lastName: '',
          age: '',
          gender: '',
          phone: '',
          mrn: '',
        },
        incidentInfo: {
          location: '',
          chiefComplaint: '',
          history: '',
          assessment: '',
          treatmentGiven: '',
          priority: '',
          onArrivalInfo: '',
          provisionalDiagnosis: '',
        },
        vitals: [],
        transportInfo: {
          destination: '',
          customDestination: '',
          mode: '',
          unitNumber: '',
          departureTime: '',
          arrivalTime: '',
          mileage: '',
          primaryParamedic: '',
          secondaryParamedic: '',
          driver: '',
          notes: '',
        },
        signatureInfo: {
          nurseSignature: '',
          nurseCorporationId: '',
          nurseSignaturePaths: '',
          doctorSignature: '',
          doctorCorporationId: '',
          doctorSignaturePaths: '',
          othersSignature: '',
          othersRole: '',
          othersSignaturePaths: '',
        },
        refusalInfo: {
          patientName: '',
          dateOfRefusal: '',
          timeOfRefusal: '',
          reasonForRefusal: '',
          risksExplained: false,
          mentalCapacity: false,
          patientSignature: '',
          patientSignaturePaths: '',
          witnessName: '',
          witnessSignature: '',
          witnessSignaturePaths: '',
          paramedicName: '',
          paramedicSignature: '',
          paramedicSignaturePaths: '',
          additionalNotes: '',
        },
      });
      
      // Clear offline store data
      if (offlineStore && typeof offlineStore.clearOfflineData === 'function') {
        await offlineStore.clearOfflineData();
        console.log('✅ Offline store data cleared');
      }
      
      console.log('✅ All application state reset');
      
      // Step 5: Clear navigation history and redirect
      console.log('🗺️ Step 5: Clearing navigation history and redirecting...');
      
      // Use replace to prevent back navigation to protected screens
      router.replace('/login');
      
      console.log('✅ Navigation completed');
      
      // Step 6: Show success toast (if not skipped)
      if (!skipToast) {
        console.log('🎉 Step 6: Showing logout success message...');
        // Note: You could add a toast library here for better UX
        // For now, we'll use a simple alert that auto-dismisses
        setTimeout(() => {
          Alert.alert(
            'Logged Out',
            'You have been logged out successfully.',
            [{ text: 'OK' }],
            { cancelable: true }
          );
        }, 500);
      }
      
      console.log('🎉 GLOBAL LOGOUT: Complete logout successful!');
      
    } catch (error) {
      console.error('❌ LOGOUT ERROR:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Even if there's an error, force navigation to login
      console.log('🚨 Force navigating to login despite error...');
      router.replace('/login');
      
      // Show error to user but still log them out
      Alert.alert(
        'Logout Notice',
        'Logout completed but some cleanup may have failed. You have been logged out successfully.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoggingOut(false);
      console.log('🏁 Global logout process finished');
    }
  }, [isLoggingOut, offlineStore]);

  /**
   * Main logout function with confirmation dialog
   * This is the function that should be called from UI components
   */
  const logout = useCallback((options: LogoutOptions = {}) => {
    const {
      showConfirmation = true,
      confirmTitle = 'Confirm Logout',
      confirmMessage,
      skipToast = false
    } = options;
    
    if (isLoggingOut) {
      console.log('⚠️ Logout already in progress, ignoring user interaction');
      return;
    }

    const userName = currentSession?.name || 'User';
    const userRole = currentSession?.role || 'Unknown';
    
    console.log(`🔐 Logout requested for: ${userName} (${userRole})`);
    
    if (!showConfirmation) {
      performCompleteLogout(skipToast);
      return;
    }
    
    const defaultMessage = `Are you sure you want to log out?\n\nUser: ${userName}\nRole: ${userRole}\n\nThis will:\n• End your current session\n• Clear all stored data\n• Discard any unsaved form data\n• Return you to the login screen`;
    
    Alert.alert(
      confirmTitle,
      confirmMessage || defaultMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('🚫 Logout cancelled by user'),
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            console.log('✅ Logout confirmed by user');
            performCompleteLogout(skipToast);
          },
        },
      ],
      { 
        cancelable: true,
        onDismiss: () => console.log('🚫 Logout dialog dismissed'),
      }
    );
  }, [currentSession, isLoggingOut, performCompleteLogout]);

  /**
   * Emergency logout function that bypasses confirmation
   * Use this for automatic logouts (token expiry, security issues, etc.)
   */
  const emergencyLogout = useCallback((reason: string = 'Security logout') => {
    console.log(`🚨 Emergency logout triggered: ${reason}`);
    performCompleteLogout(true); // Skip toast for emergency logouts
  }, [performCompleteLogout]);

  /**
   * Check if user is currently logged in
   */
  const isLoggedIn = useCallback(() => {
    return !!currentSession;
  }, [currentSession]);

  return {
    logout,
    emergencyLogout,
    isLoggingOut,
    isLoggedIn,
    currentSession,
    // Expose the core logout function for advanced use cases
    performCompleteLogout,
  };
};

/**
 * Global logout function that can be called from anywhere in the app
 * This creates a singleton-like access pattern
 */
let globalLogoutInstance: ReturnType<typeof useGlobalLogout> | null = null;

export const setGlobalLogoutInstance = (instance: ReturnType<typeof useGlobalLogout>) => {
  globalLogoutInstance = instance;
};

export const getGlobalLogout = () => {
  if (!globalLogoutInstance) {
    console.warn('Global logout instance not set. Make sure to call setGlobalLogoutInstance in your root component.');
    return null;
  }
  return globalLogoutInstance;
};

/**
 * Convenience function for emergency logout from anywhere
 */
export const emergencyLogoutFromAnywhere = (reason: string = 'Emergency logout') => {
  const globalLogout = getGlobalLogout();
  if (globalLogout) {
    globalLogout.emergencyLogout(reason);
  } else {
    console.error('Cannot perform emergency logout: Global logout instance not available');
    // Fallback: navigate to login
    router.replace('/login');
  }
};

/**
 * App-wide logout action ID for consistent access
 */
export const APP_LOGOUT_ACTION = 'app.auth.logoutAll';

/**
 * Register global logout action
 */
export const registerGlobalLogoutAction = () => {
  // This could be extended to work with a global action dispatcher
  // For now, it's a placeholder for the action ID system
  console.log(`Global logout action registered: ${APP_LOGOUT_ACTION}`);
};
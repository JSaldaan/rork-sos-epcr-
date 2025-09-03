import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePCRStore } from '@/store/pcrStore';

interface LogoutOptions {
  showConfirmation?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  skipToast?: boolean;
}

/**
 * Universal logout hook that works from any screen or form
 * Provides comprehensive session termination with confirmation
 */
export const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const { currentSession, staffLogout } = usePCRStore();

  /**
   * Complete logout process that clears all data and redirects to login
   */
  const performCompleteLogout = useCallback(async (skipToast: boolean = false) => {
    console.log('🚀 LOGOUT: Starting complete logout process...');
    
    if (isLoggingOut) {
      console.log('⚠️ Logout already in progress, preventing duplicate');
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      // Step 1: Clear all AsyncStorage data
      console.log('📱 Step 1: Clearing ALL AsyncStorage data...');
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('Found storage keys to clear:', allKeys.length);
      await AsyncStorage.multiRemove(allKeys);
      console.log('✅ All AsyncStorage data cleared');
      
      // Step 2: Clear web-specific storage
      if (Platform.OS === 'web') {
        console.log('🌐 Step 2: Clearing web storage...');
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
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
      
      // Step 3: Call store logout method
      console.log('🔄 Step 3: Calling store logout method...');
      if (staffLogout) {
        await staffLogout();
      }
      console.log('✅ Store logout method completed');
      
      // Step 4: Clear offline store data (optional)
      try {
        const { useOfflineStore } = await import('@/store/offlineStore');
        const offlineStore = useOfflineStore.getState();
        if (offlineStore && typeof offlineStore.clearOfflineData === 'function') {
          await offlineStore.clearOfflineData();
          console.log('✅ Offline store data cleared');
        }
      } catch (error) {
        console.log('⚠️ Could not clear offline store data:', error);
      }
      
      // Step 5: Navigate to login
      console.log('🗺️ Step 5: Navigating to login screen...');
      router.replace('/login');
      console.log('✅ Navigation completed');
      
      // Step 6: Show success message (if not skipped)
      if (!skipToast) {
        setTimeout(() => {
          Alert.alert(
            'Logged Out',
            'You have been logged out successfully.',
            [{ text: 'OK' }],
            { cancelable: true }
          );
        }, 500);
      }
      
      console.log('🎉 LOGOUT: Complete logout successful!');
      
    } catch (error) {
      console.error('❌ LOGOUT ERROR:', error);
      
      // Even if there's an error, force navigation to login
      console.log('🚨 Force navigating to login despite error...');
      router.replace('/login');
      
      Alert.alert(
        'Logout Notice',
        'Logout completed but some cleanup may have failed. You have been logged out successfully.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoggingOut(false);
      console.log('🏁 Logout process finished');
    }
  }, [isLoggingOut, staffLogout]);

  /**
   * Main logout function with confirmation dialog
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
   */
  const emergencyLogout = useCallback((reason: string = 'Emergency logout') => {
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
  };
};
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePCRStore } from '@/store/pcrStore';

interface LogoutOptions {
  showConfirmation?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
}

export const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const { currentSession } = usePCRStore();

  const performLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    console.log('🚀 Starting logout process...');
    
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage cleared');
      
      // Clear web storage if on web
      if (Platform.OS === 'web') {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
          console.log('✅ Web storage cleared');
        } catch (webError) {
          console.log('⚠️ Web storage clear failed:', webError);
        }
      }
      
      // Reset store state
      usePCRStore.setState({
        currentSession: null,
        isAdmin: false,
      });
      console.log('✅ Store state reset');
      
      // Navigate to login
      router.replace('/login');
      console.log('✅ Logout completed');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force navigation even if there's an error
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const logout = useCallback((options: LogoutOptions = {}) => {
    const {
      showConfirmation = true,
      confirmTitle = 'Confirm Logout',
      confirmMessage,
    } = options;
    
    if (isLoggingOut) return;

    const userName = currentSession?.name || 'User';
    const userRole = currentSession?.role || 'Unknown';
    
    if (!showConfirmation) {
      performLogout();
      return;
    }
    
    const defaultMessage = `Are you sure you want to log out?\n\nUser: ${userName}\nRole: ${userRole}\n\nThis will end your session and clear all data.`;
    
    Alert.alert(
      confirmTitle,
      confirmMessage || defaultMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
      { cancelable: true }
    );
  }, [currentSession, isLoggingOut, performLogout]);

  const isLoggedIn = useCallback(() => {
    return !!currentSession;
  }, [currentSession]);

  return {
    logout,
    isLoggingOut,
    isLoggedIn,
    currentSession,
  };
};
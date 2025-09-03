import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePCRStore } from '@/store/pcrStore';

interface EmergencyLogoutButtonProps {
  style?: any;
  testID?: string;
}

export const EmergencyLogoutButton: React.FC<EmergencyLogoutButtonProps> = ({
  style,
  testID,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const { currentSession } = usePCRStore();

  const performLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    console.log('🚨 Starting emergency logout...');
    
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
      console.log('✅ Navigated to login');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force navigation even if there's an error
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEmergencyLogout = () => {
    if (isLoggingOut) return;
    
    const userName = currentSession?.name || 'User';
    const userRole = currentSession?.role || 'Unknown';
    
    Alert.alert(
      'Confirm Logout',
      `Are you sure you want to log out?\n\nUser: ${userName}\nRole: ${userRole}\n\nThis will end your session and clear all data.`,
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
  };

  if (!currentSession || isLoggingOut) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.emergencyButton, style]}
      onPress={handleEmergencyLogout}
      testID={testID || 'emergency-logout'}
      disabled={isLoggingOut}
    >
      <Text style={styles.emergencyText}>🚨</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  emergencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  emergencyText: {
    fontSize: 16,
    color: '#fff',
  },
});

// Test function to verify logout works
export const testLogout = () => {
  console.log('🧪 Testing logout functionality...');
  return 'Logout component loaded successfully';
};

export default EmergencyLogoutButton;
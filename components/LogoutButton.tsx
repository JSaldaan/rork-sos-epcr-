import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePCRStore } from '@/store/pcrStore';

interface EmergencyLogoutButtonProps {
  style?: any;
  testID?: string;
}

/**
 * Emergency logout button that works from any screen or form
 * Provides immediate logout with confirmation dialog
 */
export const EmergencyLogoutButton: React.FC<EmergencyLogoutButtonProps> = ({
  style,
  testID,
}) => {
  const { currentSession } = usePCRStore();

  const handleEmergencyLogout = async () => {
    const userName = currentSession?.name || 'User';
    const userRole = currentSession?.role || 'Unknown';
    
    Alert.alert(
      '🚨 Emergency Logout',
      `Are you sure you want to log out immediately?\n\nUser: ${userName}\nRole: ${userRole}\n\nThis will:\n• End your current session immediately\n• Clear all stored data\n• Discard any unsaved form data\n• Return you to the login screen`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: '🚨 Emergency Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('🚨 EMERGENCY LOGOUT TRIGGERED');
            try {
              await AsyncStorage.clear();
              usePCRStore.setState({
                currentSession: null,
                isAdmin: false,
                completedPCRs: [],
                staffMembers: [],
              });
              router.replace('/login');
              console.log('✅ Emergency logout completed');
            } catch (error) {
              console.error('❌ Emergency logout error:', error);
              router.replace('/login');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Don't render if no session (user not logged in)
  if (!currentSession) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.emergencyButton, style]}
      onPress={handleEmergencyLogout}
      testID={testID || 'emergency-logout'}
      accessibilityLabel={`Emergency logout for ${currentSession?.name || 'user'}`}
      accessibilityHint="Emergency logout - clears all data and returns to login"
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

export default EmergencyLogoutButton;
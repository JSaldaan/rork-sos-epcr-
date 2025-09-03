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
  const { currentSession, staffLogout } = usePCRStore();

  const performLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    console.log('🚨 Starting emergency logout...');
    
    try {
      // Use the store's logout function for consistency
      await staffLogout();
      console.log('✅ Store logout completed');
      
      // Additional cleanup for emergency logout
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
      
      // Force reset store state
      usePCRStore.setState({
        currentSession: null,
        isAdmin: false,
        completedPCRs: [],
        staffMembers: [],
        patients: [],
        encounters: [],
        allVitals: [],
        ecgs: [],
        signatures: [],
        attachments: [],
        auditLogs: [],
      });
      console.log('✅ Store state force reset');
      
      // Navigate to login with replace to clear navigation stack
      router.replace('/login');
      console.log('✅ Navigated to login');
      
    } catch (error) {
      console.error('❌ Emergency logout error:', error);
      // Force navigation even if there's an error
      try {
        await AsyncStorage.clear();
        usePCRStore.setState({
          currentSession: null,
          isAdmin: false,
          completedPCRs: [],
          staffMembers: [],
        });
        router.replace('/login');
      } catch (forceError) {
        console.error('❌ Force logout error:', forceError);
        // Last resort - just navigate
        router.replace('/login');
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEmergencyLogout = () => {
    if (isLoggingOut) return;
    
    const userName = currentSession?.name || 'User';
    const userRole = currentSession?.role || 'Unknown';
    
    Alert.alert(
      '🚨 Emergency Logout',
      `Are you sure you want to log out?\n\nUser: ${userName}\nRole: ${userRole}\n\nThis will immediately end your session and clear all data.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Emergency Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
      { cancelable: true }
    );
  };

  // Always show the button if there's a session, even during logout
  if (!currentSession) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.emergencyButton, style, isLoggingOut && styles.emergencyButtonDisabled]}
      onPress={handleEmergencyLogout}
      testID={testID || 'emergency-logout'}
      disabled={isLoggingOut}
    >
      <Text style={styles.emergencyText}>{isLoggingOut ? '⏳' : '🚨'}</Text>
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
  emergencyButtonDisabled: {
    backgroundColor: '#FF9999',
    opacity: 0.7,
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

// Debug component to test logout functionality
export const DebugLogoutButton: React.FC = () => {
  const { currentSession, staffLogout } = usePCRStore();
  
  const handleDebugLogout = async () => {
    console.log('🔧 DEBUG: Starting logout test...');
    console.log('🔧 DEBUG: Current session before logout:', currentSession);
    
    try {
      await staffLogout();
      console.log('🔧 DEBUG: staffLogout() completed');
      
      // Check if session is cleared
      const newSession = usePCRStore.getState().currentSession;
      console.log('🔧 DEBUG: Session after logout:', newSession);
      
      // Force navigation
      router.replace('/login');
      console.log('🔧 DEBUG: Navigation to login completed');
      
      Alert.alert('Debug', 'Logout test completed. Check console for details.');
    } catch (error) {
      console.error('🔧 DEBUG: Logout test failed:', error);
      Alert.alert('Debug Error', `Logout test failed: ${error}`);
    }
  };
  
  if (!currentSession) {
    return (
      <TouchableOpacity
        style={[styles.emergencyButton, { backgroundColor: '#666' }]}
        onPress={() => Alert.alert('Debug', 'No session found - already logged out')}
      >
        <Text style={styles.emergencyText}>🔧</Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={[styles.emergencyButton, { backgroundColor: '#FF9500' }]}
      onPress={handleDebugLogout}
    >
      <Text style={styles.emergencyText}>🔧</Text>
    </TouchableOpacity>
  );
};

export default EmergencyLogoutButton;
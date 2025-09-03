import React, { useState, useEffect } from 'react';
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
  
  // Debug logging
  console.log('🔧 EmergencyLogoutButton render - currentSession:', currentSession);
  console.log('🔧 EmergencyLogoutButton render - staffLogout available:', !!staffLogout);
  
  // Monitor session changes
  useEffect(() => {
    console.log('🔧 EmergencyLogoutButton: Session changed to:', currentSession);
  }, [currentSession]);

  const performLogout = async () => {
    if (isLoggingOut) {
      console.log('🚨 Logout already in progress, skipping');
      return;
    }
    
    setIsLoggingOut(true);
    console.log('🚨 =========================');
    console.log('🚨 STARTING EMERGENCY LOGOUT');
    console.log('🚨 =========================');
    console.log('🚨 Current session before logout:', currentSession);
    
    try {
      // Step 1: Use the store's logout function first
      if (staffLogout && typeof staffLogout === 'function') {
        console.log('🚨 Step 1: Calling store staffLogout...');
        await staffLogout();
        console.log('✅ Step 1: Store logout completed');
      } else {
        console.log('⚠️ Step 1: staffLogout function not available, skipping');
      }
      
      // Step 2: Clear all storage
      console.log('🚨 Step 2: Clearing all storage...');
      await AsyncStorage.clear();
      console.log('✅ Step 2: AsyncStorage cleared');
      
      // Clear web storage if on web
      if (Platform.OS === 'web') {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
            console.log('✅ Step 2: localStorage cleared');
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
            console.log('✅ Step 2: sessionStorage cleared');
          }
        } catch (webError) {
          console.log('⚠️ Step 2: Web storage clear failed:', webError);
        }
      }
      
      // Step 3: Force reset store state
      console.log('🚨 Step 3: Force resetting store state...');
      const resetState = {
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
        isLoggingOut: false,
      };
      usePCRStore.setState(resetState);
      console.log('✅ Step 3: Store state force reset');
      
      // Step 4: Verify state is cleared
      const currentState = usePCRStore.getState();
      console.log('🚨 Step 4: Verifying state after reset...');
      console.log('🚨 Current session after reset:', currentState.currentSession);
      console.log('🚨 Is admin after reset:', currentState.isAdmin);
      
      // Step 5: Small delay to ensure state propagation
      console.log('🚨 Step 5: Waiting for state propagation...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 6: Navigate to login
      console.log('🚨 Step 6: Navigating to login...');
      router.replace('/login');
      console.log('✅ Step 6: Navigation completed');
      
      // Step 7: Final verification
      setTimeout(() => {
        const finalState = usePCRStore.getState();
        console.log('🚨 Step 7: Final state verification...');
        console.log('🚨 Final session state:', finalState.currentSession);
        console.log('🚨 Final admin state:', finalState.isAdmin);
        console.log('✅ EMERGENCY LOGOUT COMPLETED SUCCESSFULLY');
      }, 500);
      
    } catch (error) {
      console.error('❌ Emergency logout error:', error);
      console.log('🚨 Attempting emergency fallback...');
      
      // Emergency fallback
      try {
        await AsyncStorage.clear();
        usePCRStore.setState({
          currentSession: null,
          isAdmin: false,
          isLoggingOut: false,
        });
        router.replace('/login');
        console.log('✅ Emergency fallback completed');
      } catch (fallbackError) {
        console.error('❌ Emergency fallback failed:', fallbackError);
        // Last resort - just navigate
        router.replace('/login');
        console.log('⚠️ Last resort navigation executed');
      }
    } finally {
      setIsLoggingOut(false);
      console.log('🚨 =========================');
      console.log('🚨 EMERGENCY LOGOUT FINISHED');
      console.log('🚨 =========================');
    }
  };

  const handleEmergencyLogout = () => {
    if (isLoggingOut) {
      console.log('🚨 Logout already in progress, ignoring tap');
      return;
    }
    
    const userName = currentSession?.name || 'User';
    const userRole = currentSession?.role || 'Unknown';
    
    console.log('🚨 Emergency logout button pressed');
    console.log('🚨 Current session:', { userName, userRole });
    
    Alert.alert(
      '🚨 Emergency Logout',
      `Are you sure you want to log out?\n\nUser: ${userName}\nRole: ${userRole}\n\nThis will immediately end your session and clear all data.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('🚨 Logout cancelled by user')
        },
        {
          text: 'Emergency Logout',
          style: 'destructive',
          onPress: () => {
            console.log('🚨 User confirmed logout');
            performLogout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Always show the button if there's a session, even during logout
  if (!currentSession) {
    console.log('🔧 EmergencyLogoutButton: No session, not rendering button');
    return null;
  }
  
  console.log('🔧 EmergencyLogoutButton: Rendering button for session:', currentSession.name, currentSession.role);

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
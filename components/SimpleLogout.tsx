import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePCRStore } from '@/store/pcrStore';

interface SimpleLogoutProps {
  variant?: 'button' | 'tab';
  showText?: boolean;
  iconSize?: number;
}

export const SimpleLogout: React.FC<SimpleLogoutProps> = ({
  variant = 'button',
  showText = true,
  iconSize = 20,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const { currentSession } = usePCRStore();

  const performLogout = async () => {
    console.log('🚀 Starting clean logout process...');
    
    if (isLoggingOut) {
      console.log('Logout already in progress, skipping');
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      // Step 1: Clear all AsyncStorage data
      console.log('Clearing all storage...');
      await AsyncStorage.clear();
      console.log('✅ Storage cleared');
      
      // Step 2: Reset store state using the store's logout method
      console.log('Calling store logout...');
      const store = usePCRStore.getState();
      if (store.staffLogout) {
        await store.staffLogout();
      }
      console.log('✅ Store logout completed');
      
      // Step 3: Navigate to login
      console.log('Navigating to login...');
      router.replace('/login');
      console.log('✅ Navigation completed');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force navigation even if there's an error
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (isLoggingOut) {
      console.log('Logout already in progress, ignoring tap');
      return;
    }

    const userName = currentSession?.name || 'User';
    
    Alert.alert(
      'Confirm Logout',
      `Are you sure you want to logout ${userName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
      { cancelable: true }
    );
  };

  if (variant === 'tab') {
    return (
      <TouchableOpacity
        style={styles.logoutTab}
        onPress={handleLogout}
        disabled={isLoggingOut}
        testID="logout-tab"
      >
        <LogOut size={iconSize} color="#FF3B30" />
        {showText && (
          <Text style={styles.logoutTabText}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
      onPress={handleLogout}
      disabled={isLoggingOut}
      testID="logout-button"
    >
      <LogOut size={iconSize} color="#FF3B30" />
      {showText && (
        <Text style={styles.logoutButtonText}>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5E5',
  },
  logoutTabText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
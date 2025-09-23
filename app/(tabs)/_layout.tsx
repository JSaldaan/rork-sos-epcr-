import { Tabs } from "expo-router";
import { FileText, Activity, Truck, User, FileX, Eye, LogOut, FolderOpen, Shield } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, Alert, StyleSheet, ActivityIndicator, View, Platform } from "react-native";
import { usePCRStore } from "@/store/pcrStore";
import { useQueryClient } from "@tanstack/react-query";
import { performCompleteLogout } from "@/utils/auth";
import { useOfflineInitialization } from "@/hooks/useOfflineInitialization";
import { colors } from '@/constants/colors';

export default function TabLayout() {
  const { currentSession, isLoggingOut } = usePCRStore();
  const queryClient = useQueryClient();
  const [isProcessingLogout, setIsProcessingLogout] = useState<boolean>(false);
  
  // Initialize offline capabilities
  useOfflineInitialization();
  
  // Determine user access level
  const isAdminUser = currentSession?.role === 'admin' || 
                     currentSession?.role === 'Admin' || 
                     currentSession?.role === 'SuperAdmin';
  
  const handleLogout = useCallback(() => {
    // Prevent multiple logout attempts
    if (isLoggingOut || isProcessingLogout) {
      if (__DEV__) {
        console.log('Logout already in progress');
      }
      return;
    }
    
    Alert.alert(
      'Confirm Logout',
      `Are you sure you want to logout${currentSession ? ` ${currentSession.name}` : ''}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsProcessingLogout(true);
            
            try {
              if (__DEV__) {
                console.log('=== STARTING COMPLETE LOGOUT PROCESS ===');
              }
              
              // Clear React Query cache first
              if (__DEV__) {
                console.log('Clearing React Query cache...');
              }
              queryClient.clear();
              queryClient.cancelQueries();
              
              // Use the comprehensive logout utility
              const result = await performCompleteLogout();
              
              if (result.success) {
                if (__DEV__) {
                  console.log('Complete logout successful');
                }
                // Show success message after a brief delay
                setTimeout(() => {
                  Alert.alert(
                    'Logged Out',
                    'You have been logged out successfully',
                    [{ text: 'OK' }]
                  );
                }, 200);
              } else {
                if (__DEV__) {
                  console.error('Logout failed:', result.error);
                }
                Alert.alert(
                  'Logout Error', 
                  'There was an issue logging out. Please try again.',
                  [
                    {
                      text: 'Retry',
                      onPress: () => {
                        // Retry logout
                        setTimeout(() => handleLogout(), 100);
                      }
                    },
                    { text: 'Cancel' }
                  ]
                );
              }
            } catch (error) {
              if (__DEV__) {
                console.error('Unexpected logout error:', error);
              }
              Alert.alert(
                'Logout Error', 
                'An unexpected error occurred. Please restart the app.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsProcessingLogout(false);
            }
          }
        }
      ]
    );
  }, [currentSession, queryClient, isLoggingOut, isProcessingLogout]);
  
  const LogoutButton = () => {
    const isDisabled = isLoggingOut || isProcessingLogout;
    
    return (
      <Pressable 
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && !isDisabled && styles.logoutButtonPressed,
          isDisabled && styles.logoutButtonDisabled
        ]}
        onPress={isDisabled ? undefined : handleLogout}
        hitSlop={20}
        disabled={isDisabled}
        testID="logout-button"
      >
        {isDisabled ? (
          <View style={styles.logoutButtonContent}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <LogOut size={22} color="#fff" />
        )}
      </Pressable>
    );
  };
  
  // Admin users only see admin tab
  if (isAdminUser) {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.brand.secondary,
          tabBarInactiveTintColor: colors.text.secondary,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.brand.secondary,
            ...(Platform.OS === 'ios' && {
              shadowColor: 'transparent',
              borderBottomWidth: 0,
            }),
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => <LogoutButton />,
          tabBarStyle: {
            backgroundColor: colors.background.primary,
            borderTopColor: colors.separator.opaque,
            borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
            ...(Platform.OS === 'ios' && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }),
          },
        }}
      >
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin Pro",
            tabBarIcon: ({ color }) => <Shield size={24} color={color} />,
            headerTitle: "MediCare Pro - Administrator Dashboard",
          }}
        />
        {/* Hide all other tabs for admin users */}
        <Tabs.Screen
          name="index"
          options={{
            href: null, // This hides the tab
          }}
        />
        <Tabs.Screen
          name="vitals"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="transport"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="summary"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="refusal"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="preview"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="myreports"
          options={{
            href: null,
          }}
        />
      </Tabs>
    );
  }
  
  // Staff and supervisors see staff tabs (no admin tab)
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.brand.primary,
          ...(Platform.OS === 'ios' && {
            shadowColor: 'transparent',
            borderBottomWidth: 0,
          }),
        },
        headerTintColor: '#FFFFFF',
        headerRight: () => <LogoutButton />,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.separator.opaque,
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
          ...(Platform.OS === 'ios' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "New PCR",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          headerTitle: "MediCare Pro - New Patient Care Report",
        }}
      />
      <Tabs.Screen
        name="vitals"
        options={{
          title: "Vitals",
          tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
          headerTitle: "MediCare Pro - Vital Signs Monitoring",
        }}
      />
      <Tabs.Screen
        name="transport"
        options={{
          title: "Transport",
          tabBarIcon: ({ color }) => <Truck size={24} color={color} />,
          headerTitle: "MediCare Pro - Transport Management",
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Summary",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          headerTitle: "MediCare Pro - Patient Summary",
        }}
      />
      <Tabs.Screen
        name="refusal"
        options={{
          title: "Refusal",
          tabBarIcon: ({ color }) => <FileX size={24} color={color} />,
          headerTitle: "MediCare Pro - Treatment Refusal",
        }}
      />
      <Tabs.Screen
        name="preview"
        options={{
          title: "Preview",
          tabBarIcon: ({ color }) => <Eye size={24} color={color} />,
          headerTitle: "MediCare Pro - Report Preview",
        }}
      />
      <Tabs.Screen
        name="myreports"
        options={{
          title: "My Reports",
          tabBarIcon: ({ color }) => <FolderOpen size={24} color={color} />,
          headerTitle: "MediCare Pro - My Submitted Reports",
        }}
      />
      {/* Hide admin tab for staff users */}
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
    minHeight: 38,
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.7,
  },
  logoutButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
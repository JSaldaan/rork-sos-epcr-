import { Tabs, router } from "expo-router";
import { FileText, Activity, Truck, User, FileX, Eye, LogOut, FolderOpen, Shield } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, Alert, StyleSheet, ActivityIndicator, View } from "react-native";
import { usePCRStore } from "../../store/pcrStore";
import { useQueryClient } from "@tanstack/react-query";
import { performCompleteLogout } from "../../utils/auth";
import { useOfflineInitialization } from "../../hooks/useOfflineInitialization";

export default function TabLayout() {
  const { currentSession, staffLogout, isLoggingOut } = usePCRStore();
  const queryClient = useQueryClient();
  const [isProcessingLogout, setIsProcessingLogout] = useState<boolean>(false);
  
  // Initialize offline capabilities
  useOfflineInitialization();
  
  // Determine user access level
  const isAdminUser = currentSession?.role === 'admin' || 
                     currentSession?.role === 'Admin' || 
                     currentSession?.role === 'SuperAdmin';
  const isSupervisorOrAdmin = isAdminUser || currentSession?.role === 'supervisor';
  const isStaffUser = !isAdminUser && !isSupervisorOrAdmin;
  
  const handleLogout = useCallback(() => {
    // Prevent multiple logout attempts
    if (isLoggingOut || isProcessingLogout) {
      console.log('Logout already in progress');
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
              console.log('=== STARTING COMPLETE LOGOUT PROCESS ===');
              
              // Clear React Query cache first
              console.log('Clearing React Query cache...');
              queryClient.clear();
              queryClient.cancelQueries();
              
              // Use the comprehensive logout utility
              const result = await performCompleteLogout();
              
              if (result.success) {
                console.log('Complete logout successful');
                // Show success message after a brief delay
                setTimeout(() => {
                  Alert.alert(
                    'Logged Out',
                    'You have been logged out successfully',
                    [{ text: 'OK' }]
                  );
                }, 200);
              } else {
                console.error('Logout failed:', result.error);
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
              console.error('Unexpected logout error:', error);
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
          tabBarActiveTintColor: "#DC2626",
          tabBarInactiveTintColor: "#666",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#DC2626",
          },
          headerTintColor: "#fff",
          headerRight: () => <LogoutButton />,
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#E5E5E5",
          },
        }}
      >
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin Dashboard",
            tabBarIcon: ({ color }) => <Shield size={24} color={color} />,
            headerTitle: "Administrator Dashboard",
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
        tabBarActiveTintColor: "#0066CC",
        tabBarInactiveTintColor: "#666",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#0066CC",
        },
        headerTintColor: "#fff",
        headerRight: () => <LogoutButton />,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E5E5E5",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "New PCR",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          headerTitle: "Electronic Patient Care Record",
        }}
      />
      <Tabs.Screen
        name="vitals"
        options={{
          title: "Vitals",
          tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
          headerTitle: "Vital Signs",
        }}
      />
      <Tabs.Screen
        name="transport"
        options={{
          title: "Transport",
          tabBarIcon: ({ color }) => <Truck size={24} color={color} />,
          headerTitle: "Transport Information",
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Summary",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          headerTitle: "PCR Summary",
        }}
      />
      <Tabs.Screen
        name="refusal"
        options={{
          title: "Refusal",
          tabBarIcon: ({ color }) => <FileX size={24} color={color} />,
          headerTitle: "Patient Refusal Form",
        }}
      />
      <Tabs.Screen
        name="preview"
        options={{
          title: "Preview",
          tabBarIcon: ({ color }) => <Eye size={24} color={color} />,
          headerTitle: "Report Preview",
        }}
      />
      <Tabs.Screen
        name="myreports"
        options={{
          title: "My Reports",
          tabBarIcon: ({ color }) => <FolderOpen size={24} color={color} />,
          headerTitle: "My Submitted Reports",
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
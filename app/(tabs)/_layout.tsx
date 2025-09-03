import { Tabs, router } from "expo-router";
import { FileText, Activity, Truck, User, FileX, Eye, LogOut, FolderOpen, Shield } from "lucide-react-native";
import React, { useCallback } from "react";
import { Pressable, Alert, StyleSheet, View, Dimensions } from "react-native";
import { usePCRStore } from "../../store/pcrStore";
import { useQueryClient } from "@tanstack/react-query";
import { OfflineStatusBar } from "@/components/OfflineStatusBar";

const { width: screenWidth } = Dimensions.get('window');

export default function TabLayout() {
  const { currentSession, staffLogout, isLoggingOut } = usePCRStore();
  const queryClient = useQueryClient();
  
  // Determine user access level
  const isAdminUser = currentSession?.role === 'admin' || 
                     currentSession?.role === 'Admin' || 
                     currentSession?.role === 'SuperAdmin';
  const isSupervisorOrAdmin = isAdminUser || currentSession?.role === 'supervisor';
  const isStaffUser = !isAdminUser && !isSupervisorOrAdmin;
  
  const handleLogout = useCallback(() => {
    // Prevent multiple logout attempts
    if (isLoggingOut) {
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
            try {
              console.log('Starting logout process...');
              
              // Clear React Query cache first
              queryClient.clear();
              queryClient.cancelQueries();
              console.log('React Query cache cleared');
              
              // Call the logout function
              await staffLogout();
              console.log('Store logout completed');
              
              // Use replace to prevent back navigation
              router.replace('/login');
              console.log('Navigation to login completed');
              
              // Show success message after navigation
              setTimeout(() => {
                Alert.alert(
                  'Success',
                  'You have been logged out successfully',
                  [{ text: 'OK' }]
                );
              }, 100);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  }, [currentSession, staffLogout, queryClient, isLoggingOut]);
  
  const LogoutButton = () => (
    <Pressable 
      style={({ pressed }) => [
        styles.logoutButton,
        pressed && styles.logoutButtonPressed
      ]}
      onPress={handleLogout}
      hitSlop={20}
      disabled={isLoggingOut}
    >
      <LogOut size={22} color="#fff" />
    </Pressable>
  );
  
  // Admin users only see admin tab
  if (isAdminUser) {
    return (
      <View style={{ flex: 1 }}>
        <OfflineStatusBar />
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
              height: Math.max(60, screenWidth * 0.15),
              paddingBottom: Math.max(5, screenWidth * 0.01),
              paddingTop: Math.max(5, screenWidth * 0.01),
            },
            tabBarLabelStyle: {
              fontSize: Math.max(10, Math.min(12, screenWidth * 0.03)),
            },
          }}
        >
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin Dashboard",
            tabBarIcon: ({ color }) => <Shield size={Math.max(20, Math.min(24, screenWidth * 0.06))} color={color} />,
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
      </View>
    );
  }
  
  // Staff and supervisors see staff tabs (no admin tab)
  return (
    <View style={{ flex: 1 }}>
      <OfflineStatusBar />
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
            height: Math.max(60, screenWidth * 0.15),
            paddingBottom: Math.max(5, screenWidth * 0.01),
            paddingTop: Math.max(5, screenWidth * 0.01),
          },
          tabBarLabelStyle: {
            fontSize: Math.max(10, Math.min(12, screenWidth * 0.03)),
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "New PCR",
          tabBarIcon: ({ color }) => <FileText size={Math.max(20, Math.min(24, screenWidth * 0.06))} color={color} />,
          headerTitle: "Electronic Patient Care Record",
        }}
      />
      <Tabs.Screen
        name="vitals"
        options={{
          title: "Vitals",
          tabBarIcon: ({ color }) => <Activity size={Math.max(20, Math.min(24, screenWidth * 0.06))} color={color} />,
          headerTitle: "Vital Signs",
        }}
      />
      <Tabs.Screen
        name="transport"
        options={{
          title: "Transport",
          tabBarIcon: ({ color }) => <Truck size={Math.max(20, Math.min(24, screenWidth * 0.06))} color={color} />,
          headerTitle: "Transport Information",
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Summary",
          tabBarIcon: ({ color }) => <User size={Math.max(20, Math.min(24, screenWidth * 0.06))} color={color} />,
          headerTitle: "PCR Summary",
        }}
      />
      <Tabs.Screen
        name="refusal"
        options={{
          title: "Refusal",
          tabBarIcon: ({ color }) => <FileX size={Math.max(20, Math.min(24, screenWidth * 0.06))} color={color} />,
          headerTitle: "Patient Refusal Form",
        }}
      />
      <Tabs.Screen
        name="preview"
        options={{
          title: "Preview",
          tabBarIcon: ({ color }) => <Eye size={Math.max(20, Math.min(24, screenWidth * 0.06))} color={color} />,
          headerTitle: "Report Preview",
        }}
      />
      <Tabs.Screen
        name="myreports"
        options={{
          title: "My Reports",
          tabBarIcon: ({ color }) => <FolderOpen size={Math.max(20, Math.min(24, screenWidth * 0.06))} color={color} />,
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
    </View>
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
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
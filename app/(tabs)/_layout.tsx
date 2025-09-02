import { Tabs, router } from "expo-router";
import { FileText, Activity, Truck, User, FileX, Eye, LogOut, FolderOpen } from "lucide-react-native";
import React, { useCallback } from "react";
import { Pressable, Alert, StyleSheet } from "react-native";
import { usePCRStore } from "../../store/pcrStore";
import { useQueryClient } from "@tanstack/react-query";

export default function TabLayout() {
  const { currentSession, staffLogout, isLoggingOut } = usePCRStore();
  const queryClient = useQueryClient();
  
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
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
import { Tabs, router } from "expo-router";
import { FileText, Activity, Truck, User, FileX, Eye, LogOut, FolderOpen } from "lucide-react-native";
import React from "react";
import { Pressable, Alert, Text, View, StyleSheet } from "react-native";
import { usePCRStore } from "../../store/pcrStore";

export default function TabLayout() {
  const { isAdmin, currentSession, staffLogout, setAdminMode } = usePCRStore();
  
  const handleLogout = () => {
    const logoutMessage = currentSession 
      ? `Are you sure you want to logout ${currentSession.name}?`
      : 'Are you sure you want to logout?';
    
    Alert.alert(
      'Logout',
      logoutMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              console.log('=== LOGOUT PROCESS STARTED ===');
              console.log('Current session before logout:', currentSession);
              console.log('Is admin before logout:', isAdmin);
              
              if (currentSession) {
                console.log('Logging out staff member:', currentSession.name);
                await staffLogout();
              } else if (isAdmin) {
                console.log('Logging out admin');
                setAdminMode(false);
              }
              
              console.log('Logout functions completed, navigating to login...');
              
              // Navigate to login page
              router.replace('/login');
              
              console.log('Navigation to login initiated');
              console.log('=== LOGOUT PROCESS COMPLETED ===');
            } catch (error) {
              console.error('Error during logout:', error);
              // Force navigation even if logout fails
              router.replace('/login');
            }
          },
        },
      ]
    );
  };
  
  const LogoutButton = () => (
    <Pressable style={styles.logoutButton} onPress={handleLogout}>
      <LogOut size={18} color="#fff" />
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
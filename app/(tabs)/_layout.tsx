import { Tabs, router } from "expo-router";
import { FileText, Activity, Truck, User, FileX, Eye, ArrowRight, FolderOpen } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, Alert, Text, View, StyleSheet, Platform } from "react-native";
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
          onPress: () => {
            console.log('=== LOGOUT PROCESS STARTED ===');
            console.log('Current session before logout:', currentSession);
            console.log('Is admin before logout:', isAdmin);
            
            // Clear session data
            if (currentSession) {
              console.log('Logging out staff member:', currentSession.name);
              staffLogout();
            } else if (isAdmin) {
              console.log('Logging out admin');
              setAdminMode(false);
            }
            
            console.log('Logout functions completed, navigating to login...');
            
            // Navigate to login and clear the navigation stack
            router.replace('/login');
            
            console.log('Navigation to login initiated');
            console.log('=== LOGOUT PROCESS COMPLETED ===');
          },
        },
      ]
    );
  };
  
  const LogoutButton = () => (
    <TouchableOpacity 
      style={styles.logoutButton}
      onPress={handleLogout}
      activeOpacity={0.7}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      accessible={true}
      accessibilityLabel="Logout"
      accessibilityRole="button"
    >
      <ArrowRight size={20} color="#fff" />
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    minWidth: 90,
    minHeight: 40,
    justifyContent: 'center',
  },

  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});
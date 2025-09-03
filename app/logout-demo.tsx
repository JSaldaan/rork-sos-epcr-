import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { GlobalLogoutButton } from '@/components/GlobalLogoutButton';
import { useAuthCheck } from '@/components/RequireAuth';

/**
 * Demo screen showing different logout button variants
 * This demonstrates how to add logout functionality to any screen
 */
export default function LogoutDemoScreen() {
  const { currentSession, isAuthenticated } = useAuthCheck();

  if (!isAuthenticated()) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Please log in to view this demo</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Global Logout System Demo</Text>
        <Text style={styles.subtitle}>
          Current User: {currentSession?.name} ({currentSession?.role})
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Header Logout Button</Text>
          <Text style={styles.description}>
            Perfect for navigation headers and top bars
          </Text>
          <View style={styles.demoContainer}>
            <GlobalLogoutButton 
              variant="header"
              showText={true}
              iconSize={20}
              testID="demo-header-logout"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standard Button</Text>
          <Text style={styles.description}>
            Default logout button for forms and main content areas
          </Text>
          <View style={styles.demoContainer}>
            <GlobalLogoutButton 
              variant="button"
              showText={true}
              testID="demo-button-logout"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimal Button</Text>
          <Text style={styles.description}>
            Compact logout button for tight spaces
          </Text>
          <View style={styles.demoContainer}>
            <GlobalLogoutButton 
              variant="minimal"
              showText={true}
              iconSize={16}
              testID="demo-minimal-logout"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tab Style Button</Text>
          <Text style={styles.description}>
            Designed to fit in tab bars and navigation areas
          </Text>
          <View style={styles.demoContainer}>
            <GlobalLogoutButton 
              variant="tab"
              showText={true}
              testID="demo-tab-logout"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Logout</Text>
          <Text style={styles.description}>
            Bypasses confirmation dialog - use for security situations
          </Text>
          <View style={styles.demoContainer}>
            <GlobalLogoutButton 
              variant="emergency"
              showText={true}
              testID="demo-emergency-logout"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Confirmation</Text>
          <Text style={styles.description}>
            Button with custom confirmation message
          </Text>
          <View style={styles.demoContainer}>
            <GlobalLogoutButton 
              variant="button"
              showText={true}
              confirmTitle="Custom Logout"
              confirmMessage="This is a custom logout confirmation message. Are you sure you want to continue?"
              testID="demo-custom-logout"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icon Only</Text>
          <Text style={styles.description}>
            Just the logout icon without text
          </Text>
          <View style={styles.demoContainer}>
            <GlobalLogoutButton 
              variant="button"
              showText={false}
              iconSize={24}
              testID="demo-icon-logout"
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔐 Global Logout Features</Text>
          <Text style={styles.infoText}>
            • Works from any screen or form{'\n'}
            • Clears all authentication data{'\n'}
            • Ends server sessions{'\n'}
            • Clears local/session storage{'\n'}
            • Resets navigation history{'\n'}
            • Shows confirmation dialog{'\n'}
            • Handles form safety{'\n'}
            • Works on mobile and desktop
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🚨 Emergency Logout</Text>
          <Text style={styles.infoText}>
            Use the emergency logout for automatic logouts due to:{'\n'}
            • Token expiration{'\n'}
            • Security violations{'\n'}
            • Session timeouts{'\n'}
            • Unauthorized access attempts
          </Text>
        </View>
      </ScrollView>

      {/* Floating logout button demo */}
      <GlobalLogoutButton 
        variant="floating"
        position="bottom-right"
        showText={false}
        iconSize={20}
        testID="demo-floating-logout"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for floating button
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  demoContainer: {
    alignItems: 'flex-start',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
});
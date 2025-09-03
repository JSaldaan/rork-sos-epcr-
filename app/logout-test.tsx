import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LogoutButton } from '@/components/LogoutButton';
import { useLogout } from '@/hooks/useLogout';
import { usePCRStore } from '@/store/pcrStore';

export default function LogoutTestScreen() {
  const { logout, emergencyLogout, isLoggingOut, isLoggedIn } = useLogout();
  const { currentSession } = usePCRStore();

  const testEmergencyLogout = () => {
    Alert.alert(
      'Test Emergency Logout',
      'This will trigger an emergency logout without confirmation. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test Emergency Logout', 
          style: 'destructive',
          onPress: () => emergencyLogout('Test emergency logout')
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Logout System Test</Text>
        <Text style={styles.subtitle}>
          Status: {isLoggedIn() ? 'Logged In' : 'Not Logged In'}
        </Text>
        {currentSession && (
          <Text style={styles.userInfo}>
            User: {currentSession.name} ({currentSession.role})
          </Text>
        )}
        <Text style={styles.status}>
          {isLoggingOut ? 'Logging out...' : 'Ready'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Header Logout</Text>
        <LogoutButton variant="header" showText={true} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Standard Button</Text>
        <LogoutButton variant="button" showText={true} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minimal Button</Text>
        <LogoutButton variant="minimal" showText={true} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tab Style</Text>
        <LogoutButton variant="tab" showText={true} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Icon Only</Text>
        <LogoutButton variant="button" showText={false} iconSize={24} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Logout (No Confirmation)</Text>
        <LogoutButton 
          variant="button" 
          showText={true} 
          showConfirmation={false}
          backgroundColor="#FF3B30"
          color="#FFFFFF"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Confirmation</Text>
        <LogoutButton 
          variant="button" 
          showText={true}
          confirmTitle="Custom Test Logout"
          confirmMessage="This is a test logout with custom message. Are you sure?"
        />
      </View>

      {/* Floating logout button */}
      <LogoutButton 
        variant="floating"
        position="bottom-right"
        showText={false}
        iconSize={20}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: '#0066CC',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
});
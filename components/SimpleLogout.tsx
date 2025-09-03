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
    console.log('🚀 Starting simple logout...');
    setIsLoggingOut(true);
    
    try {
      // Step 1: Clear AsyncStorage completely
      console.log('Clearing AsyncStorage...');
      await AsyncStorage.clear();
      
      // Step 2: Reset store to initial state
      console.log('Resetting store state...');
      const store = usePCRStore.getState();
      
      // Call the store's logout method if it exists
      if (store.staffLogout) {
        await store.staffLogout();
      }
      
      // Force reset all state to initial values
      usePCRStore.setState({
        currentSession: null,
        isAdmin: false,
        isLoggingOut: false,
        completedPCRs: [],
        staffMembers: [],
        patients: [],
        encounters: [],
        allVitals: [],
        ecgs: [],
        signatures: [],
        attachments: [],
        auditLogs: [],
        callTimeInfo: {
          timeOfCall: '',
          date: '',
          arrivalOnScene: '',
          atPatientSide: '',
          toDestination: '',
          atDestination: '',
        },
        patientInfo: {
          firstName: '',
          lastName: '',
          age: '',
          gender: '',
          phone: '',
          mrn: '',
        },
        incidentInfo: {
          location: '',
          chiefComplaint: '',
          history: '',
          assessment: '',
          treatmentGiven: '',
          priority: '',
          onArrivalInfo: '',
          provisionalDiagnosis: '',
        },
        vitals: [],
        transportInfo: {
          destination: '',
          customDestination: '',
          mode: '',
          unitNumber: '',
          departureTime: '',
          arrivalTime: '',
          mileage: '',
          primaryParamedic: '',
          secondaryParamedic: '',
          driver: '',
          notes: '',
        },
        signatureInfo: {
          nurseSignature: '',
          nurseCorporationId: '',
          nurseSignaturePaths: '',
          doctorSignature: '',
          doctorCorporationId: '',
          doctorSignaturePaths: '',
          othersSignature: '',
          othersRole: '',
          othersSignaturePaths: '',
        },
        refusalInfo: {
          patientName: '',
          dateOfRefusal: '',
          timeOfRefusal: '',
          reasonForRefusal: '',
          risksExplained: false,
          mentalCapacity: false,
          patientSignature: '',
          patientSignaturePaths: '',
          witnessName: '',
          witnessSignature: '',
          witnessSignaturePaths: '',
          paramedicName: '',
          paramedicSignature: '',
          paramedicSignaturePaths: '',
          additionalNotes: '',
        },
      });
      
      // Step 3: Wait a moment for state to settle
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 4: Navigate to login
      console.log('Navigating to login...');
      router.replace('/login');
      
      console.log('✅ Logout completed successfully');
      
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
      console.log('Logout already in progress');
      return;
    }

    Alert.alert(
      'Confirm Logout',
      `Are you sure you want to logout${currentSession ? ` ${currentSession.name}` : ''}?\n\nAll unsaved data will be lost.`,
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
      ]
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
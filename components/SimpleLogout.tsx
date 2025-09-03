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

  // Emergency logout - bypasses all complex logic
  const emergencyLogout = async () => {
    console.log('🚨 EMERGENCY LOGOUT - Forcing immediate logout...');
    
    try {
      // Step 1: Clear all storage immediately
      await AsyncStorage.clear();
      console.log('✅ All storage cleared');
      
      // Step 2: Reset store to completely empty state
      const initialState = {
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
      };
      
      usePCRStore.setState(initialState);
      console.log('✅ Store state reset');
      
      // Step 3: Force navigation to login
      router.replace('/login');
      console.log('✅ Navigated to login');
      
      console.log('🎉 EMERGENCY LOGOUT COMPLETED!');
      
    } catch (error) {
      console.error('❌ Emergency logout error:', error);
      // Even if there's an error, force navigation
      router.replace('/login');
    }
  };

  const performLogout = async () => {
    console.log('🚀 Starting logout process...');
    
    if (isLoggingOut) {
      console.log('Logout already in progress, skipping');
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      console.log('Step 1: Clearing all AsyncStorage data...');
      // Clear all possible stored data
      const keys = await AsyncStorage.getAllKeys();
      console.log('Found storage keys:', keys);
      await AsyncStorage.multiRemove(keys);
      console.log('All AsyncStorage data cleared');
      
      console.log('Step 2: Resetting store state...');
      // Get the store and call its logout method
      const store = usePCRStore.getState();
      if (typeof store.staffLogout === 'function') {
        await store.staffLogout();
        console.log('Store logout method called');
      }
      
      console.log('Step 3: Force reset store state...');
      // Force complete state reset
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
      
      console.log('Step 4: Waiting for state to settle...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Step 5: Navigating to login screen...');
      router.replace('/login');
      
      console.log('✅ Logout completed successfully!');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      console.log('Falling back to emergency logout...');
      // If normal logout fails, use emergency logout
      await emergencyLogout();
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
      `Are you sure you want to logout ${userName}?\n\nAll unsaved data will be lost.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Logout cancelled by user'),
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            console.log('User confirmed logout');
            performLogout();
          },
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
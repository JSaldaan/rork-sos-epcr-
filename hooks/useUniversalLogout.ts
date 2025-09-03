import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePCRStore } from '@/store/pcrStore';

export const useUniversalLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const { currentSession, staffLogout } = usePCRStore();

  const performCompleteLogout = async () => {
    console.log('🚀 UNIVERSAL LOGOUT HOOK: Starting complete logout process...');
    
    if (isLoggingOut) {
      console.log('⚠️ Logout already in progress, preventing duplicate');
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      console.log('📱 Step 1: Clearing ALL AsyncStorage data...');
      // Clear all possible storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('Found storage keys:', allKeys);
      await AsyncStorage.multiRemove(allKeys);
      console.log('✅ All AsyncStorage data cleared');
      
      console.log('🔄 Step 2: Resetting Zustand store state...');
      // Force reset the entire store to initial state
      usePCRStore.setState({
        currentSession: null,
        isAdmin: false,
        completedPCRs: [],
        staffMembers: [],
        isLoggingOut: false,
        // Reset admin data
        patients: [],
        encounters: [],
        allVitals: [],
        ecgs: [],
        signatures: [],
        attachments: [],
        auditLogs: [],
        // Reset PCR data to initial values
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
      console.log('✅ Store state completely reset');
      
      console.log('🔄 Step 3: Calling store logout method...');
      // Also call the store's logout method for any additional cleanup
      if (staffLogout) {
        await staffLogout();
      }
      console.log('✅ Store logout method completed');
      
      console.log('🧹 Step 4: Additional cleanup for web compatibility...');
      // Clear any web-specific storage
      if (Platform.OS === 'web') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          console.log('✅ Web storage cleared');
        } catch {
          console.log('ℹ️ Web storage not available or already cleared');
        }
      }
      
      console.log('🚀 Step 5: Navigating to login screen...');
      // Force navigation to login with replace to prevent back navigation
      router.replace('/login');
      console.log('✅ Navigation to login completed');
      
      console.log('🎉 UNIVERSAL LOGOUT HOOK: Complete logout successful!');
      
    } catch (error) {
      console.error('❌ LOGOUT ERROR:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Even if there's an error, force navigation to login
      console.log('🚨 Force navigating to login despite error...');
      router.replace('/login');
      
      // Show error to user but still log them out
      Alert.alert(
        'Logout Notice',
        'Logout completed but some cleanup may have failed. You have been logged out successfully.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoggingOut(false);
      console.log('🏁 Logout process finished');
    }
  };

  const logout = (showConfirmation: boolean = true) => {
    if (isLoggingOut) {
      console.log('⚠️ Logout already in progress, ignoring user interaction');
      return;
    }

    const userName = currentSession?.name || 'User';
    const userRole = currentSession?.role || 'Unknown';
    
    console.log(`🔐 Logout requested for: ${userName} (${userRole})`);
    
    if (!showConfirmation) {
      performCompleteLogout();
      return;
    }
    
    Alert.alert(
      'Confirm Logout',
      `Are you sure you want to log out?\n\nUser: ${userName}\nRole: ${userRole}\n\nThis will clear all session data and return you to the login screen.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('🚫 Logout cancelled by user'),
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            console.log('✅ Logout confirmed by user');
            performCompleteLogout();
          },
        },
      ],
      { 
        cancelable: true,
        onDismiss: () => console.log('🚫 Logout dialog dismissed'),
      }
    );
  };

  return {
    logout,
    isLoggingOut,
    currentSession,
  };
};
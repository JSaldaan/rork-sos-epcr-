import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ViewStyle, TextStyle } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePCRStore } from '@/store/pcrStore';

interface LogoutButtonProps {
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  iconColor?: string;
  showText?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  onLogoutStart?: () => void;
  onLogoutComplete?: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  style,
  textStyle,
  iconSize = 20,
  iconColor,
  showText = true,
  variant = 'danger',
  onLogoutStart,
  onLogoutComplete,
}) => {
  const { currentSession } = usePCRStore();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
          defaultIconColor: '#fff',
        };
      case 'secondary':
        return {
          button: styles.secondaryButton,
          text: styles.secondaryText,
          defaultIconColor: '#666',
        };
      case 'danger':
      default:
        return {
          button: styles.dangerButton,
          text: styles.dangerText,
          defaultIconColor: '#FF3B30',
        };
    }
  };

  const performLogout = async () => {
    console.log('🚀 SIMPLE LOGOUT: Starting logout process');
    setIsLoggingOut(true);
    onLogoutStart?.();
    
    try {
      // Step 1: Clear all AsyncStorage data
      console.log('🧹 Clearing AsyncStorage...');
      await AsyncStorage.clear();
      
      // Step 2: Reset store state completely
      console.log('🔄 Resetting store state...');
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
      
      // Step 3: Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 4: Navigate to login
      console.log('🔄 Navigating to login...');
      router.replace('/login');
      
      console.log('✅ SIMPLE LOGOUT: Logout completed successfully');
      onLogoutComplete?.();
      
    } catch (error) {
      console.error('❌ SIMPLE LOGOUT: Error during logout:', error);
      // Force navigation even if there's an error
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (isLoggingOut) {
      console.log('Logout already in progress, ignoring button press');
      return;
    }

    Alert.alert(
      'Confirm Logout',
      `Are you sure you want to logout${currentSession ? ` ${currentSession.name}` : ''}? All unsaved data will be lost.`,
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

  const variantStyles = getVariantStyles();
  const finalIconColor = iconColor || variantStyles.defaultIconColor;

  return (
    <TouchableOpacity
      style={[variantStyles.button, style]}
      onPress={handleLogout}
      disabled={isLoggingOut}
      activeOpacity={0.7}
      testID="logout-button"
    >
      <LogOut size={iconSize} color={finalIconColor} />
      {showText && (
        <Text style={[variantStyles.text, textStyle]}>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0066CC',
    borderRadius: 8,
    gap: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 8,
  },
  secondaryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerButton: {
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
  dangerText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
});
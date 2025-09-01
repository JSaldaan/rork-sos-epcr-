import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  StyleSheet,
  Share,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { usePCRStore, CompletedPCR, StaffMember } from '../../store/pcrStore';
import { Trash2, Copy, Download, LogOut, Eye, Shield, Users, Clock, UserPlus, UserCheck, UserX, Settings } from 'lucide-react-native';

const AdminScreen: React.FC = () => {
  const {
    completedPCRs,
    loadCompletedPCRs,
    deletePCR,
    setAdminMode,
    isAdmin,
    adminLogin,
    staffLogin,
    staffLogout,
    currentSession,
    staffMembers,
    addStaffMember,
    deactivateStaffMember,
    reactivateStaffMember,
    isSuperAdmin,
  } = usePCRStore();
  
  const [selectedPCR, setSelectedPCR] = useState<CompletedPCR | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [corporationId, setCorporationId] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginMode, setLoginMode] = useState<'staff' | 'admin' | 'superadmin'>('staff');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showStaffManagement, setShowStaffManagement] = useState<boolean>(false);
  const [newStaffForm, setNewStaffForm] = useState<{
    corporationId: string;
    name: string;
    role: 'paramedic' | 'nurse' | 'doctor' | 'admin' | 'supervisor';
    department: string;
  }>({ corporationId: '', name: '', role: 'paramedic', department: '' });
  const [staffFormError, setStaffFormError] = useState<string>('');

  useEffect(() => {
    if (isAdmin) {
      console.log('Admin mode detected, loading PCRs...');
      loadCompletedPCRs();
    }
  }, [isAdmin, loadCompletedPCRs]);

  // Refresh data whenever the admin screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (isAdmin) {
        console.log('Admin screen focused, loading PCRs...');
        loadCompletedPCRs();
      }
    }, [isAdmin, loadCompletedPCRs])
  );

  // Also refresh when component mounts
  useEffect(() => {
    if (isAdmin) {
      console.log('Admin component mounted, loading PCRs...');
      loadCompletedPCRs();
    }
  }, [isAdmin, loadCompletedPCRs]);

  const formatPCRForWord = (pcr: CompletedPCR): string => {
    return `PATIENT CARE REPORT\n` +
      `Report ID: ${pcr.id}\n` +
      `Submitted: ${new Date(pcr.submittedAt).toLocaleString()}\n\n` +
      
      `PATIENT INFORMATION\n` +
      `Name: ${pcr.patientInfo.firstName || 'N/A'} ${pcr.patientInfo.lastName || 'N/A'}\n` +
      `Age: ${pcr.patientInfo.age || 'N/A'}\n` +
      `Gender: ${pcr.patientInfo.gender || 'N/A'}\n` +
      `Phone: ${pcr.patientInfo.phone || 'N/A'}\n` +
      `MRN: ${pcr.patientInfo.mrn || 'N/A'}\n\n` +
      
      `CALL TIME INFORMATION\n` +
      `Date: ${pcr.callTimeInfo.date || 'N/A'}\n` +
      `Time of Call: ${pcr.callTimeInfo.timeOfCall || 'N/A'}\n` +
      `Arrival on Scene: ${pcr.callTimeInfo.arrivalOnScene || 'N/A'}\n` +
      `At Patient Side: ${pcr.callTimeInfo.atPatientSide || 'N/A'}\n` +
      `To Destination: ${pcr.callTimeInfo.toDestination || 'N/A'}\n` +
      `At Destination: ${pcr.callTimeInfo.atDestination || 'N/A'}\n\n` +
      
      `INCIDENT INFORMATION\n` +
      `Location: ${pcr.incidentInfo.location || 'N/A'}\n` +
      `Chief Complaint: ${pcr.incidentInfo.chiefComplaint || 'N/A'}\n` +
      `History: ${pcr.incidentInfo.history || 'N/A'}\n` +
      `Assessment: ${pcr.incidentInfo.assessment || 'N/A'}\n` +
      `Treatment Given: ${pcr.incidentInfo.treatmentGiven || 'N/A'}\n` +
      `Priority: ${pcr.incidentInfo.priority || 'N/A'}\n` +
      `On Arrival Info: ${pcr.incidentInfo.onArrivalInfo || 'N/A'}\n` +
      `Provisional Diagnosis: ${pcr.incidentInfo.provisionalDiagnosis || 'N/A'}\n\n` +
      
      `VITAL SIGNS\n` +
      (pcr.vitals && pcr.vitals.length > 0 ? 
        pcr.vitals.map((vital, index) => 
          `Reading ${index + 1} (${vital.timestamp ? new Date(vital.timestamp).toLocaleString() : 'N/A'}):\n` +
          `  BP: ${vital.bloodPressureSystolic || 'N/A'}/${vital.bloodPressureDiastolic || 'N/A'}\n` +
          `  HR: ${vital.heartRate || 'N/A'} bpm\n` +
          `  RR: ${vital.respiratoryRate || 'N/A'} /min\n` +
          `  O2 Sat: ${vital.oxygenSaturation || 'N/A'}%\n` +
          `  Temp: ${vital.temperature || 'N/A'}°C\n` +
          `  Blood Glucose: ${vital.bloodGlucose || 'N/A'} mmol/L\n` +
          `  Pain Scale: ${vital.painScale || 'N/A'}/10\n` +
          (vital.ecgCapture ? 
            `  ECG Capture: Available (ID: ${vital.ecgCapture})\n` +
            `  ECG Timestamp: ${vital.ecgCaptureTimestamp ? new Date(vital.ecgCaptureTimestamp).toLocaleString() : 'N/A'}\n`
            : ''
          )
        ).join('\n') : 'No vital signs recorded\n'
      ) + '\n' +
      
      `TRANSPORT INFORMATION\n` +
      `Destination: ${pcr.transportInfo.destination || 'N/A'}\n` +
      `Mode: ${pcr.transportInfo.mode || 'N/A'}\n` +
      `Unit Number: ${pcr.transportInfo.unitNumber || 'N/A'}\n` +
      `Departure Time: ${pcr.transportInfo.departureTime || 'N/A'}\n` +
      `Arrival Time: ${pcr.transportInfo.arrivalTime || 'N/A'}\n` +
      `Mileage: ${pcr.transportInfo.mileage || 'N/A'}\n` +
      `Primary Paramedic: ${pcr.transportInfo.primaryParamedic || 'N/A'}\n` +
      `Secondary Paramedic: ${pcr.transportInfo.secondaryParamedic || 'N/A'}\n` +
      `Driver: ${pcr.transportInfo.driver || 'N/A'}\n` +
      `Notes: ${pcr.transportInfo.notes || 'N/A'}\n\n` +
      
      `RECEIVING STAFF SIGNATURES\n` +
      `Nurse: ${pcr.signatureInfo.nurseSignature || 'N/A'} (ID: ${pcr.signatureInfo.nurseCorporationId || 'N/A'})\n` +
      `Nurse Signature: ${pcr.signatureInfo.nurseSignaturePaths ? 'Signed' : 'Not Signed'}\n` +
      (pcr.signatureInfo.nurseSignaturePaths ? 
        `Nurse Signature Data: ${pcr.signatureInfo.nurseSignaturePaths.substring(0, 50)}...\n` : ''
      ) +
      `Doctor: ${pcr.signatureInfo.doctorSignature || 'N/A'} (ID: ${pcr.signatureInfo.doctorCorporationId || 'N/A'})\n` +
      `Doctor Signature: ${pcr.signatureInfo.doctorSignaturePaths ? 'Signed' : 'Not Signed'}\n` +
      (pcr.signatureInfo.doctorSignaturePaths ? 
        `Doctor Signature Data: ${pcr.signatureInfo.doctorSignaturePaths.substring(0, 50)}...\n` : ''
      ) +
      `Other: ${pcr.signatureInfo.othersSignature || 'N/A'} (Role: ${pcr.signatureInfo.othersRole || 'N/A'})\n` +
      `Other Signature: ${pcr.signatureInfo.othersSignaturePaths ? 'Signed' : 'Not Signed'}\n` +
      (pcr.signatureInfo.othersSignaturePaths ? 
        `Other Signature Data: ${pcr.signatureInfo.othersSignaturePaths.substring(0, 50)}...\n` : ''
      ) + '\n' +
      
      `REFUSAL INFORMATION\n` +
      `Patient Name: ${pcr.refusalInfo.patientName || 'N/A'}\n` +
      `Date of Refusal: ${pcr.refusalInfo.dateOfRefusal || 'N/A'}\n` +
      `Time of Refusal: ${pcr.refusalInfo.timeOfRefusal || 'N/A'}\n` +
      `Reason: ${pcr.refusalInfo.reasonForRefusal || 'N/A'}\n` +
      `Risks Explained: ${pcr.refusalInfo.risksExplained ? 'Yes' : 'No'}\n` +
      `Mental Capacity: ${pcr.refusalInfo.mentalCapacity ? 'Yes' : 'No'}\n` +
      `Patient Signature: ${pcr.refusalInfo.patientSignaturePaths ? 'Signed' : 'Not Signed'}\n` +
      (pcr.refusalInfo.patientSignaturePaths ? 
        `Patient Signature Data: ${pcr.refusalInfo.patientSignaturePaths.substring(0, 50)}...\n` : ''
      ) +
      `Witness: ${pcr.refusalInfo.witnessName || 'N/A'}\n` +
      `Witness Signature: ${pcr.refusalInfo.witnessSignaturePaths ? 'Signed' : 'Not Signed'}\n` +
      (pcr.refusalInfo.witnessSignaturePaths ? 
        `Witness Signature Data: ${pcr.refusalInfo.witnessSignaturePaths.substring(0, 50)}...\n` : ''
      ) +
      `Paramedic: ${pcr.refusalInfo.paramedicName || 'N/A'}\n` +
      `Paramedic Signature: ${pcr.refusalInfo.paramedicSignaturePaths ? 'Signed' : 'Not Signed'}\n` +
      (pcr.refusalInfo.paramedicSignaturePaths ? 
        `Paramedic Signature Data: ${pcr.refusalInfo.paramedicSignaturePaths.substring(0, 50)}...\n` : ''
      ) +
      `Additional Notes: ${pcr.refusalInfo.additionalNotes || 'N/A'}\n\n` +
      
      `ATTACHMENTS AND CAPTURES\n` +
      `ECG Captures: ${pcr.vitals.filter(v => v.ecgCapture).length} available\n` +
      (pcr.vitals.filter(v => v.ecgCapture).length > 0 ? 
        pcr.vitals.filter(v => v.ecgCapture).map((vital, index) => 
          `  ECG ${index + 1}: ${vital.ecgCapture} (${vital.ecgCaptureTimestamp ? new Date(vital.ecgCaptureTimestamp).toLocaleString() : 'N/A'})\n`
        ).join('') : ''
      ) +
      `Total Signatures: ${[
        pcr.signatureInfo.nurseSignaturePaths,
        pcr.signatureInfo.doctorSignaturePaths,
        pcr.signatureInfo.othersSignaturePaths,
        pcr.refusalInfo.patientSignaturePaths,
        pcr.refusalInfo.witnessSignaturePaths,
        pcr.refusalInfo.paramedicSignaturePaths
      ].filter(Boolean).length} captured\n`;
  };

  const copyToClipboard = async (pcr: CompletedPCR) => {
    const formattedText = formatPCRForWord(pcr);
    
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(formattedText);
        Alert.alert('Success', 'PCR data copied to clipboard! You can now paste it into Word.');
      } catch (error) {
        console.error('Copy failed:', error);
        Alert.alert('Error', 'Failed to copy to clipboard');
      }
    } else {
      try {
        await Share.share({
          message: formattedText,
          title: `PCR Report ${pcr.id}`,
        });
      } catch (error) {
        console.error('Share failed:', error);
        Alert.alert('Error', 'Failed to share PCR data');
      }
    }
  };

  const handleDeletePCR = (id: string) => {
    Alert.alert(
      'Delete PCR',
      'Are you sure you want to delete this PCR? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePCR(id),
        },
      ]
    );
  };

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
            console.log('Logging out...');
            // Reset local state
            setSelectedPCR(null);
            setShowDetails(false);
            setPassword('');
            setCorporationId('');
            setLoginError('');
            setLoginMode('staff');
            
            if (currentSession) {
              await staffLogout();
            } else {
              setAdminMode(false);
            }
            
            console.log('Logout complete, redirecting to login');
            router.replace('/login');
          },
        },
      ]
    );
  };

  const PCRCard: React.FC<{ pcr: CompletedPCR }> = ({ pcr }) => (
    <View style={styles.pcrCard}>
      <View style={styles.pcrHeader}>
        <View>
          <Text style={styles.pcrId}>PCR #{pcr.id}</Text>
          <Text style={styles.patientName}>
            {pcr.patientInfo.firstName || 'N/A'} {pcr.patientInfo.lastName || 'N/A'}
          </Text>
          <Text style={styles.submittedDate}>
            {new Date(pcr.submittedAt).toLocaleString()}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              setSelectedPCR(pcr);
              setShowDetails(true);
            }}
          >
            <Eye size={20} color="#0066CC" />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => copyToClipboard(pcr)}
          >
            <Copy size={20} color="#28a745" />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleDeletePCR(pcr.id)}
          >
            <Trash2 size={20} color="#dc3545" />
          </Pressable>
        </View>
      </View>
      <View style={styles.pcrSummary}>
        <Text style={styles.summaryText}>Location: {pcr.incidentInfo.location || 'N/A'}</Text>
        <Text style={styles.summaryText}>Complaint: {pcr.incidentInfo.chiefComplaint || 'N/A'}</Text>
        <Text style={styles.summaryText}>Destination: {pcr.transportInfo.destination || 'N/A'}</Text>
      </View>
    </View>
  );

  const PCRDetails: React.FC<{ pcr: CompletedPCR }> = ({ pcr }) => (
    <ScrollView 
      style={styles.detailsContainer}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View style={styles.detailsHeader}>
        <Text style={styles.detailsTitle}>PCR Details #{pcr.id}</Text>
        <Pressable
          style={styles.closeButton}
          onPress={() => setShowDetails(false)}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <Text style={styles.detailText}>Name: {pcr.patientInfo.firstName || 'N/A'} {pcr.patientInfo.lastName || 'N/A'}</Text>
        <Text style={styles.detailText}>Age: {pcr.patientInfo.age || 'N/A'}</Text>
        <Text style={styles.detailText}>Gender: {pcr.patientInfo.gender || 'N/A'}</Text>
        <Text style={styles.detailText}>Phone: {pcr.patientInfo.phone || 'N/A'}</Text>
        <Text style={styles.detailText}>MRN: {pcr.patientInfo.mrn || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Call Time Information</Text>
        <Text style={styles.detailText}>Date: {pcr.callTimeInfo.date || 'N/A'}</Text>
        <Text style={styles.detailText}>Time of Call: {pcr.callTimeInfo.timeOfCall || 'N/A'}</Text>
        <Text style={styles.detailText}>Arrival on Scene: {pcr.callTimeInfo.arrivalOnScene || 'N/A'}</Text>
        <Text style={styles.detailText}>At Patient Side: {pcr.callTimeInfo.atPatientSide || 'N/A'}</Text>
        <Text style={styles.detailText}>To Destination: {pcr.callTimeInfo.toDestination || 'N/A'}</Text>
        <Text style={styles.detailText}>At Destination: {pcr.callTimeInfo.atDestination || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incident Information</Text>
        <Text style={styles.detailText}>Location: {pcr.incidentInfo.location || 'N/A'}</Text>
        <Text style={styles.detailText}>Chief Complaint: {pcr.incidentInfo.chiefComplaint || 'N/A'}</Text>
        <Text style={styles.detailText}>History: {pcr.incidentInfo.history || 'N/A'}</Text>
        <Text style={styles.detailText}>Assessment: {pcr.incidentInfo.assessment || 'N/A'}</Text>
        <Text style={styles.detailText}>Treatment: {pcr.incidentInfo.treatmentGiven || 'N/A'}</Text>
        <Text style={styles.detailText}>Priority: {pcr.incidentInfo.priority || 'N/A'}</Text>
        <Text style={styles.detailText}>On Arrival Info: {pcr.incidentInfo.onArrivalInfo || 'N/A'}</Text>
        <Text style={styles.detailText}>Provisional Diagnosis: {pcr.incidentInfo.provisionalDiagnosis || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vital Signs ({pcr.vitals.length} readings)</Text>
        {pcr.vitals.length > 0 ? pcr.vitals.map((vital, index) => (
          <View key={index} style={styles.vitalReading}>
            <Text style={styles.vitalTime}>Reading #{index + 1} - {vital.timestamp ? new Date(vital.timestamp).toLocaleString() : 'N/A'}</Text>
            <Text style={styles.detailText}>BP: {vital.bloodPressureSystolic || 'N/A'}/{vital.bloodPressureDiastolic || 'N/A'}</Text>
            <Text style={styles.detailText}>HR: {vital.heartRate || 'N/A'} bpm, RR: {vital.respiratoryRate || 'N/A'} /min</Text>
            <Text style={styles.detailText}>O2 Sat: {vital.oxygenSaturation || 'N/A'}%, Temp: {vital.temperature || 'N/A'}°C</Text>
            <Text style={styles.detailText}>Blood Glucose: {vital.bloodGlucose || 'N/A'} mmol/L, Pain: {vital.painScale || 'N/A'}/10</Text>
            {vital.ecgCapture && (
              <View style={styles.ecgCaptureInfo}>
                <Text style={styles.ecgCaptureText}>📈 ECG Captured</Text>
                <Text style={styles.detailText}>ECG ID: {vital.ecgCapture}</Text>
                <Text style={styles.detailText}>Captured: {vital.ecgCaptureTimestamp ? new Date(vital.ecgCaptureTimestamp).toLocaleString() : 'N/A'}</Text>
              </View>
            )}
          </View>
        )) : (
          <Text style={styles.detailText}>No vital signs recorded</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transport Information</Text>
        <Text style={styles.detailText}>Destination: {pcr.transportInfo.destination || 'N/A'}</Text>
        <Text style={styles.detailText}>Mode: {pcr.transportInfo.mode || 'N/A'}</Text>
        <Text style={styles.detailText}>Unit Number: {pcr.transportInfo.unitNumber || 'N/A'}</Text>
        <Text style={styles.detailText}>Departure Time: {pcr.transportInfo.departureTime || 'N/A'}</Text>
        <Text style={styles.detailText}>Arrival Time: {pcr.transportInfo.arrivalTime || 'N/A'}</Text>
        <Text style={styles.detailText}>Mileage: {pcr.transportInfo.mileage || 'N/A'}</Text>
        <Text style={styles.detailText}>Primary Paramedic: {pcr.transportInfo.primaryParamedic || 'N/A'}</Text>
        <Text style={styles.detailText}>Secondary Paramedic: {pcr.transportInfo.secondaryParamedic || 'N/A'}</Text>
        <Text style={styles.detailText}>Driver: {pcr.transportInfo.driver || 'N/A'}</Text>
        <Text style={styles.detailText}>Notes: {pcr.transportInfo.notes || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receiving Staff Signatures</Text>
        <View style={styles.signatureGroup}>
          <Text style={styles.signatureTitle}>Nurse</Text>
          <Text style={styles.detailText}>Name: {pcr.signatureInfo.nurseSignature || 'N/A'}</Text>
          <Text style={styles.detailText}>Corporation ID: {pcr.signatureInfo.nurseCorporationId || 'N/A'}</Text>
          <Text style={[styles.detailText, pcr.signatureInfo.nurseSignaturePaths ? styles.signedText : styles.notSignedText]}>
            Signature: {pcr.signatureInfo.nurseSignaturePaths ? '✓ Signed' : 'Not Signed'}
          </Text>
        </View>
        
        <View style={styles.signatureGroup}>
          <Text style={styles.signatureTitle}>Doctor</Text>
          <Text style={styles.detailText}>Name: {pcr.signatureInfo.doctorSignature || 'N/A'}</Text>
          <Text style={styles.detailText}>Corporation ID: {pcr.signatureInfo.doctorCorporationId || 'N/A'}</Text>
          <Text style={[styles.detailText, pcr.signatureInfo.doctorSignaturePaths ? styles.signedText : styles.notSignedText]}>
            Signature: {pcr.signatureInfo.doctorSignaturePaths ? '✓ Signed' : 'Not Signed'}
          </Text>
        </View>
        
        <View style={styles.signatureGroup}>
          <Text style={styles.signatureTitle}>Other</Text>
          <Text style={styles.detailText}>Name: {pcr.signatureInfo.othersSignature || 'N/A'}</Text>
          <Text style={styles.detailText}>Role: {pcr.signatureInfo.othersRole || 'N/A'}</Text>
          <Text style={[styles.detailText, pcr.signatureInfo.othersSignaturePaths ? styles.signedText : styles.notSignedText]}>
            Signature: {pcr.signatureInfo.othersSignaturePaths ? '✓ Signed' : 'Not Signed'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Refusal Information</Text>
        <Text style={styles.detailText}>Patient Name: {pcr.refusalInfo.patientName || 'N/A'}</Text>
        <Text style={styles.detailText}>Date of Refusal: {pcr.refusalInfo.dateOfRefusal || 'N/A'}</Text>
        <Text style={styles.detailText}>Time of Refusal: {pcr.refusalInfo.timeOfRefusal || 'N/A'}</Text>
        <Text style={styles.detailText}>Reason: {pcr.refusalInfo.reasonForRefusal || 'N/A'}</Text>
        <Text style={styles.detailText}>Risks Explained: {pcr.refusalInfo.risksExplained ? 'Yes' : 'No'}</Text>
        <Text style={styles.detailText}>Mental Capacity: {pcr.refusalInfo.mentalCapacity ? 'Yes' : 'No'}</Text>
        
        <View style={styles.signatureGroup}>
          <Text style={styles.signatureTitle}>Patient Signature</Text>
          <Text style={[styles.detailText, pcr.refusalInfo.patientSignaturePaths ? styles.signedText : styles.notSignedText]}>
            {pcr.refusalInfo.patientSignaturePaths ? '✓ Signed' : 'Not Signed'}
          </Text>
        </View>
        
        <View style={styles.signatureGroup}>
          <Text style={styles.signatureTitle}>Witness</Text>
          <Text style={styles.detailText}>Name: {pcr.refusalInfo.witnessName || 'N/A'}</Text>
          <Text style={[styles.detailText, pcr.refusalInfo.witnessSignaturePaths ? styles.signedText : styles.notSignedText]}>
            Signature: {pcr.refusalInfo.witnessSignaturePaths ? '✓ Signed' : 'Not Signed'}
          </Text>
        </View>
        
        <View style={styles.signatureGroup}>
          <Text style={styles.signatureTitle}>Paramedic</Text>
          <Text style={styles.detailText}>Name: {pcr.refusalInfo.paramedicName || 'N/A'}</Text>
          <Text style={[styles.detailText, pcr.refusalInfo.paramedicSignaturePaths ? styles.signedText : styles.notSignedText]}>
            Signature: {pcr.refusalInfo.paramedicSignaturePaths ? '✓ Signed' : 'Not Signed'}
          </Text>
        </View>
        
        <Text style={styles.detailText}>Additional Notes: {pcr.refusalInfo.additionalNotes || 'N/A'}</Text>
      </View>

      <Pressable
        style={styles.copyButton}
        onPress={() => copyToClipboard(pcr)}
      >
        <Copy size={20} color="#fff" />
        <Text style={styles.copyButtonText}>Copy Full Report</Text>
      </Pressable>
    </ScrollView>
  );



  // If not authenticated, this should not happen as login is handled at app level
  if (!isAdmin && !currentSession) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Access Denied</Text>
          <Text style={styles.noAccessText}>Please login to access the admin panel</Text>
        </View>
      </View>
    );
  }

  const handleAddStaffMember = async () => {
    if (!newStaffForm.corporationId.trim() || !newStaffForm.name.trim() || !newStaffForm.department.trim()) {
      setStaffFormError('All fields are required');
      return;
    }

    // Check if Corporation ID already exists
    const existingStaff = staffMembers.find(s => s.corporationId === newStaffForm.corporationId.toUpperCase());
    if (existingStaff) {
      setStaffFormError('Corporation ID already exists');
      return;
    }

    try {
      const newStaff: StaffMember = {
        corporationId: newStaffForm.corporationId.toUpperCase(),
        name: newStaffForm.name,
        role: newStaffForm.role,
        department: newStaffForm.department,
        isActive: true,
      };

      await addStaffMember(newStaff);
      setNewStaffForm({ corporationId: '', name: '', role: 'paramedic', department: '' });
      setStaffFormError('');
      Alert.alert('Success', `Staff member ${newStaff.corporationId} has been added successfully.`);
    } catch (error) {
      console.error('Error adding staff member:', error);
      setStaffFormError('Failed to add staff member');
    }
  };

  const handleToggleStaffStatus = async (staff: StaffMember) => {
    const action = staff.isActive ? 'deactivate' : 'reactivate';
    const actionText = staff.isActive ? 'Deactivate' : 'Reactivate';
    
    Alert.alert(
      `${actionText} Staff Member`,
      `Are you sure you want to ${action} ${staff.name} (${staff.corporationId})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          style: staff.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (staff.isActive) {
                await deactivateStaffMember(staff.corporationId);
              } else {
                await reactivateStaffMember(staff.corporationId);
              }
              Alert.alert('Success', `${staff.name} has been ${staff.isActive ? 'deactivated' : 'reactivated'}.`);
            } catch (error) {
              console.error(`Error ${action}ing staff member:`, error);
              Alert.alert('Error', `Failed to ${action} staff member`);
            }
          },
        },
      ]
    );
  };

  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [staffFilterRole, setStaffFilterRole] = useState<string>('all');
  const [staffFilterStatus, setStaffFilterStatus] = useState<string>('all');
  const [showAddStaffForm, setShowAddStaffForm] = useState<boolean>(false);

  const filteredStaffMembers = staffMembers.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                         staff.corporationId.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                         staff.department.toLowerCase().includes(staffSearchQuery.toLowerCase());
    const matchesRole = staffFilterRole === 'all' || staff.role === staffFilterRole;
    const matchesStatus = staffFilterStatus === 'all' || 
                         (staffFilterStatus === 'active' && staff.isActive) ||
                         (staffFilterStatus === 'inactive' && !staff.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const StaffManagementView = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.staffHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Staff Management</Text>
          <Text style={styles.sessionText}>Super Admin Panel</Text>
        </View>
        <Pressable 
          style={styles.backButton} 
          onPress={() => setShowStaffManagement(false)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.staffStatsContainer}>
        <View style={styles.staffStatsRow}>
          <View style={styles.staffStatItem}>
            <Text style={styles.staffStatsNumber}>{staffMembers.filter(s => s.isActive).length}</Text>
            <Text style={styles.staffStatsLabel}>Active Staff</Text>
          </View>
          <View style={styles.staffStatItem}>
            <Text style={styles.staffStatsNumber}>{staffMembers.filter(s => !s.isActive).length}</Text>
            <Text style={styles.staffStatsLabel}>Inactive Staff</Text>
          </View>
          <View style={styles.staffStatItem}>
            <Text style={styles.staffStatsNumber}>{staffMembers.length}</Text>
            <Text style={styles.staffStatsLabel}>Total Staff</Text>
          </View>
        </View>
      </View>

      <View style={styles.staffControlsContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or department..."
            value={staffSearchQuery}
            onChangeText={setStaffSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            returnKeyType="search"
            blurOnSubmit={false}
            keyboardType="default"
            textContentType="none"
            autoComplete="off"
            selectTextOnFocus={false}
            onSubmitEditing={() => {}}
          />
        </View>
        
        <View style={styles.filtersRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Role:</Text>
            <View style={styles.filterButtons}>
              {['all', 'paramedic', 'nurse', 'doctor', 'admin', 'supervisor'].map((role) => (
                <Pressable
                  key={role}
                  style={[
                    styles.filterButton,
                    staffFilterRole === role && styles.filterButtonActive
                  ]}
                  onPress={() => setStaffFilterRole(role)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    staffFilterRole === role && styles.filterButtonTextActive
                  ]}>
                    {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterButtons}>
              {['all', 'active', 'inactive'].map((status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.filterButton,
                    staffFilterStatus === status && styles.filterButtonActive
                  ]}
                  onPress={() => setStaffFilterStatus(status)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    staffFilterStatus === status && styles.filterButtonTextActive
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Pressable 
          style={styles.addStaffToggleButton} 
          onPress={() => setShowAddStaffForm(!showAddStaffForm)}
        >
          <UserPlus size={20} color="#fff" />
          <Text style={styles.addStaffToggleText}>
            {showAddStaffForm ? 'Cancel' : 'Add New Staff'}
          </Text>
        </Pressable>
      </View>

      {showAddStaffForm && (
        <View style={styles.addStaffSection}>
          <Text style={styles.sectionTitle}>Add New Staff Member</Text>
          
          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Text style={styles.inputLabel}>Corporation ID</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., PARA003, NURSE002"
                value={newStaffForm.corporationId}
                onChangeText={(text) => {
                  setNewStaffForm(prev => ({ ...prev, corporationId: text }));
                  setStaffFormError('');
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="next"
                blurOnSubmit={false}
                maxLength={20}
                keyboardType="default"
                textContentType="none"
                autoComplete="off"
                selectTextOnFocus={false}
                onSubmitEditing={() => {}}
              />
            </View>

            <View style={styles.formColumn}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full name"
                value={newStaffForm.name}
                onChangeText={(text) => {
                  setNewStaffForm(prev => ({ ...prev, name: text }));
                  setStaffFormError('');
                }}
                autoCapitalize="words"
                autoCorrect={true}
                clearButtonMode="while-editing"
                returnKeyType="next"
                blurOnSubmit={false}
                maxLength={50}
                keyboardType="default"
                textContentType="name"
                autoComplete="name"
                selectTextOnFocus={false}
                onSubmitEditing={() => {}}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {(['paramedic', 'nurse', 'doctor', 'admin', 'supervisor'] as const).map((role) => (
                  <Pressable
                    key={role}
                    style={[
                      styles.roleButton,
                      newStaffForm.role === role && styles.roleButtonActive
                    ]}
                    onPress={() => setNewStaffForm(prev => ({ ...prev, role }))}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      newStaffForm.role === role && styles.roleButtonTextActive
                    ]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formColumn}>
              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Emergency Services, IT"
                value={newStaffForm.department}
                onChangeText={(text) => {
                  setNewStaffForm(prev => ({ ...prev, department: text }));
                  setStaffFormError('');
                }}
                autoCapitalize="words"
                autoCorrect={true}
                clearButtonMode="while-editing"
                returnKeyType="done"
                blurOnSubmit={false}
                maxLength={50}
                keyboardType="default"
                textContentType="none"
                autoComplete="off"
                selectTextOnFocus={false}
                onSubmitEditing={() => {}}
              />
            </View>
          </View>

          {staffFormError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{staffFormError}</Text>
            </View>
          ) : null}

          <Pressable style={styles.addStaffButton} onPress={handleAddStaffMember}>
            <UserPlus size={20} color="#fff" />
            <Text style={styles.addStaffButtonText}>Add Staff Member</Text>
          </Pressable>
        </View>
      )}

      <ScrollView 
        style={styles.staffListContainer}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.staffListHeader}>
          <Text style={styles.sectionTitle}>
            Staff Members ({filteredStaffMembers.length} of {staffMembers.length})
          </Text>
        </View>
        
        {filteredStaffMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {staffSearchQuery || staffFilterRole !== 'all' || staffFilterStatus !== 'all' 
                ? 'No staff members match your filters' 
                : 'No staff members found'}
            </Text>
            {(staffSearchQuery || staffFilterRole !== 'all' || staffFilterStatus !== 'all') && (
              <Pressable 
                style={styles.clearFiltersButton}
                onPress={() => {
                  setStaffSearchQuery('');
                  setStaffFilterRole('all');
                  setStaffFilterStatus('all');
                }}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredStaffMembers.map((staff) => (
            <View key={staff.corporationId} style={styles.staffCard}>
              <View style={styles.staffCardHeader}>
                <View style={styles.staffInfo}>
                  <View style={styles.staffNameRow}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      staff.isActive ? styles.statusActive : styles.statusInactive
                    ]}>
                      <Text style={[
                        styles.statusText,
                        staff.isActive ? styles.statusTextActive : styles.statusTextInactive
                      ]}>
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.staffId}>ID: {staff.corporationId}</Text>
                  <View style={styles.staffDetailsRow}>
                    <Text style={styles.staffRole}>{staff.role.toUpperCase()}</Text>
                    <Text style={styles.staffDepartment}>{staff.department}</Text>
                  </View>
                  {staff.lastLogin && (
                    <Text style={styles.staffLastLogin}>
                      Last login: {new Date(staff.lastLogin).toLocaleString()}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={[
                    styles.toggleButton,
                    staff.isActive ? styles.deactivateButton : styles.activateButton
                  ]}
                  onPress={() => handleToggleStaffStatus(staff)}
                >
                  {staff.isActive ? (
                    <UserX size={16} color="#fff" />
                  ) : (
                    <UserCheck size={16} color="#fff" />
                  )}
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (showStaffManagement && isSuperAdmin()) {
    return <StaffManagementView />;
  }

  if (showDetails && selectedPCR) {
    return <PCRDetails pcr={selectedPCR} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Admin Panel</Text>
          {currentSession && (
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionText}>
                {currentSession.name} ({currentSession.corporationId})
              </Text>
              <Text style={styles.sessionRole}>{currentSession.role.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {isSuperAdmin() && (
            <Pressable 
              style={styles.staffManagementButton} 
              onPress={() => setShowStaffManagement(true)}
            >
              <Settings size={20} color="#fff" />
              <Text style={styles.staffManagementText}>Staff</Text>
            </Pressable>
          )}
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statsNumber}>{completedPCRs.length}</Text>
            <Text style={styles.statsLabel}>Total PCRs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statsNumber}>{staffMembers.filter(s => s.isActive).length}</Text>
            <Text style={styles.statsLabel}>Active Staff</Text>
          </View>
          {currentSession && (
            <View style={styles.statItem}>
              <Clock size={16} color="#6b7280" />
              <Text style={styles.statsLabel}>
                Logged in: {new Date(currentSession.loginTime).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.pcrList}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {completedPCRs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No PCRs submitted yet</Text>
          </View>
        ) : (
          completedPCRs.map((pcr) => <PCRCard key={pcr.id} pcr={pcr} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0066CC',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  logoutText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  pcrList: {
    flex: 1,
    padding: 16,
  },
  pcrCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pcrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pcrId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  submittedDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  pcrSummary: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  summaryText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  noAccessText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 48,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  passwordInput: {
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hintContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  hintText: {
    fontSize: 12,
    color: '#0066CC',
    textAlign: 'center',
  },
  hintSubtext: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Staff Management Styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffManagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  staffManagementText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0066CC',
  },
  backButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  staffStatsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  staffStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  staffStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  staffStatsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  staffStatsLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  staffControlsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    minHeight: 44,
    color: '#374151',
    textAlignVertical: 'center',
  },
  filtersRow: {
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  addStaffToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addStaffToggleText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  addStaffSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  roleButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  roleButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  addStaffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addStaffButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  staffListContainer: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  staffListHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  clearFiltersButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  staffCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  staffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  staffInfo: {
    flex: 1,
  },
  staffNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  staffId: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  staffDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '600',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  staffDepartment: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  staffLastLogin: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#16a34a',
  },
  statusTextInactive: {
    color: '#dc2626',
  },
  toggleButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  deactivateButton: {
    backgroundColor: '#dc2626',
  },
  activateButton: {
    backgroundColor: '#16a34a',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0066CC',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  vitalReading: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  vitalTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
  },
  signatureGroup: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0066CC',
  },
  signatureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 8,
  },
  signedText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  notSignedText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  ecgCaptureInfo: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  ecgCaptureText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  // New authentication styles
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginModeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    padding: 4,
    width: '100%',
    maxWidth: 400,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#0066CC',
  },
  modeButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#0066CC',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    minHeight: 44,
    color: '#374151',
    textAlignVertical: 'center',
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  demoContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
    maxWidth: 400,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoIds: {
    alignItems: 'flex-start',
  },
  demoId: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  // Header updates
  headerLeft: {
    flex: 1,
  },
  sessionInfo: {
    marginTop: 4,
  },
  sessionText: {
    fontSize: 12,
    color: '#e5e7eb',
  },
  sessionRole: {
    fontSize: 10,
    color: '#93c5fd',
    fontWeight: '600',
  },
  // Stats updates
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  statsLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  // Super Admin specific styles
  superAdminInput: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  superAdminHint: {
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    fontWeight: '500',
  },
  superAdminHintContainer: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#dc3545',
  },
  superAdminHintText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  superAdminHintSubtext: {
    color: '#dc3545',
    fontWeight: '500',
  },
});

export default AdminScreen;
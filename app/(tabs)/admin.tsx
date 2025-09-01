import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  Share,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { usePCRStore, CompletedPCR } from '../../store/pcrStore';
import { Trash2, Copy, LogOut, Eye, Clock } from 'lucide-react-native';

const AdminScreen: React.FC = () => {
  const {
    completedPCRs,
    loadCompletedPCRs,
    deletePCR,
    setAdminMode,
    isAdmin,
    staffLogout,
    currentSession,
  } = usePCRStore();
  
  const [selectedPCR, setSelectedPCR] = useState<CompletedPCR | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

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
            try {
              console.log('Logout button pressed, starting logout process...');
              
              // Reset local state first
              setSelectedPCR(null);
              setShowDetails(false);
              
              // Clear session and admin state
              if (currentSession) {
                console.log('Staff session found, calling staffLogout...');
                await staffLogout();
              } else {
                console.log('No staff session, calling setAdminMode(false)...');
                setAdminMode(false);
              }
              
              console.log('Logout complete, navigating to login...');
              
              // Use router.push instead of replace to ensure navigation works
              router.push('/login');
              
              console.log('Navigation to login completed');
            } catch (error) {
              console.error('Error during logout:', error);
              // Force navigation even if logout fails
              router.push('/login');
            }
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
          <Text style={styles.submittedBy}>
            Submitted by: {pcr.submittedBy.name} ({pcr.submittedBy.role})
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
        <Text style={styles.summaryText}>Corporation ID: {pcr.submittedBy.corporationId}</Text>
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
      
      <View style={styles.submissionInfo}>
        <Text style={styles.submissionTitle}>Submission Details</Text>
        <Text style={styles.submissionText}>Submitted: {new Date(pcr.submittedAt).toLocaleString()}</Text>
        <Text style={styles.submissionText}>By: {pcr.submittedBy.name} ({pcr.submittedBy.corporationId})</Text>
        <Text style={styles.submissionText}>Role: {pcr.submittedBy.role.toUpperCase()}</Text>
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
  submittedBy: {
    fontSize: 11,
    color: '#0066CC',
    marginTop: 2,
    fontStyle: 'italic',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  
  // Submission info styles
  submissionInfo: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  submissionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 8,
  },
  submissionText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },

});

export default AdminScreen;
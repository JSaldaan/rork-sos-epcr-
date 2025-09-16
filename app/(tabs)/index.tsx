import React, { useCallback, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ResponsiveContainer, ResponsiveRow } from '@/components/ResponsiveLayout';
import { spacing, isTablet } from '@/utils/responsive';
import { Clock, MapPin, User, ChevronDown, Shield, Mic, Activity } from "lucide-react-native";
import { usePCRStore } from "@/store/pcrStore";
import { router } from "expo-router";
import { OfflineStatus } from "@/components/OfflineStatus";
import { VoiceNotesModal } from "@/components/VoiceNotesModal";
import TraumaBodyDiagram from "@/components/TraumaBodyDiagram";

const priorityOptions = ["Emergency", "Urgent", "Non-Urgent"] as const;

const provisionalDiagnosisOptions = [
  "Acute Myocardial Infarction (AMI)",
  "Acute Coronary Syndrome",
  "Cardiac Arrest",
  "Congestive Heart Failure",
  "Hypertensive Emergency",
  "Stroke/CVA",
  "Transient Ischemic Attack (TIA)",
  "Seizure Disorder",
  "Diabetic Emergency",
  "Hypoglycemia",
  "Hyperglycemia/DKA",
  "Respiratory Distress",
  "Asthma Exacerbation",
  "COPD Exacerbation",
  "Pneumonia",
  "Pulmonary Embolism",
  "Anaphylaxis",
  "Allergic Reaction",
  "Trauma - Multiple",
  "Trauma - Head Injury",
  "Trauma - Spinal Injury",
  "Trauma - Fracture",
  "Motor Vehicle Accident",
  "Fall Injury",
  "Burn Injury",
  "Overdose - Drug",
  "Overdose - Alcohol",
  "Poisoning",
  "Psychiatric Emergency",
  "Suicidal Ideation",
  "Altered Mental Status",
  "Syncope",
  "Chest Pain - Non-Cardiac",
  "Abdominal Pain",
  "Gastrointestinal Bleeding",
  "Renal Colic",
  "Urinary Tract Infection",
  "Sepsis",
  "Shock - Hypovolemic",
  "Shock - Cardiogenic",
  "Shock - Septic",
  "Dehydration",
  "Heat Exhaustion",
  "Hypothermia",
  "Pregnancy Related",
  "Labor and Delivery",
  "Pediatric Emergency",
  "Geriatric Emergency",
  "No Apparent Distress",
  "Others",
] as const;

export default function NewPCRScreen() {
  const { 
    callTimeInfo, 
    updateCallTimeInfo, 
    patientInfo, 
    updatePatientInfo, 
    incidentInfo, 
    updateIncidentInfo,
    adminLogin,
    isAdmin,

    currentSession,
  } = usePCRStore();
  const [showDiagnosisModal, setShowDiagnosisModal] = useState<boolean>(false);
  const [showCustomDiagnosisInput, setShowCustomDiagnosisInput] = useState<boolean>(false);
  const [customDiagnosis, setCustomDiagnosis] = useState<string>("");
  const [showOthersInput, setShowOthersInput] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showOfflineDetails, setShowOfflineDetails] = useState<boolean>(false);
  const [showVoiceNotes, setShowVoiceNotes] = useState<boolean>(false);
  const [showTraumaDiagram, setShowTraumaDiagram] = useState<boolean>(false);

  const { saveTabDataWithNotification } = usePCRStore();
  
  // Route guard: Admin users should not access this screen
  const isAdminUser = currentSession?.role === 'admin' || 
                     currentSession?.role === 'Admin' || 
                     currentSession?.role === 'SuperAdmin';
  
  useEffect(() => {
    if (isAdminUser) {
      console.log('Admin user trying to access staff screen, redirecting to admin');
      router.replace('/(tabs)/admin');
    }
  }, [isAdminUser]);



  const handleSaveTab = useCallback(async () => {
    try {
      await saveTabDataWithNotification('Patient Info');
      Alert.alert("Success", "Patient information saved successfully!");
    } catch {
      Alert.alert("Error", "Failed to save patient information. Please try again.");
    }
  }, [saveTabDataWithNotification]);

  const handleSubmitReport = useCallback(async () => {
    if (!patientInfo.firstName || !patientInfo.lastName) {
      Alert.alert("Incomplete Data", "Please enter patient's first and last name before submitting.");
      return;
    }
    
    Alert.alert(
      "Submit Patient Report",
      "Are you sure you want to submit this patient information report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "default",
          onPress: async () => {
            try {
              await saveTabDataWithNotification('Patient Info');
              Alert.alert(
                "Patient Report Submitted",
                "Your patient information has been submitted successfully! Continue to other tabs to complete the full PCR."
              );
            } catch {
              Alert.alert("Error", "Failed to submit patient report. Please try again.");
            }
          }
        }
      ]
    );
  }, [patientInfo.firstName, patientInfo.lastName, saveTabDataWithNotification]);

  const handleCallTimeChange = useCallback((field: keyof typeof callTimeInfo) => 
    (text: string) => updateCallTimeInfo({ [field]: text }), [updateCallTimeInfo]);
  
  const handlePatientChange = useCallback((field: keyof typeof patientInfo) => 
    (text: string) => updatePatientInfo({ [field]: text }), [updatePatientInfo]);
  
  const handleIncidentChange = useCallback((field: keyof typeof incidentInfo) => 
    (text: string) => updateIncidentInfo({ [field]: text }), [updateIncidentInfo]);

  const handleGenderSelect = useCallback((gender: string) => {
    updatePatientInfo({ gender });
  }, [updatePatientInfo]);

  const handlePrioritySelect = useCallback((priority: string) => {
    updateIncidentInfo({ priority });
  }, [updateIncidentInfo]);

  const handleDiagnosisSelect = useCallback((diagnosis: string) => {
    if (diagnosis === "Others") {
      setShowCustomDiagnosisInput(true);
      setShowOthersInput(true);
      updateIncidentInfo({ provisionalDiagnosis: "Others" });
      setShowDiagnosisModal(false);
    } else {
      updateIncidentInfo({ provisionalDiagnosis: diagnosis });
      setShowDiagnosisModal(false);
      setShowOthersInput(false);
      setCustomDiagnosis("");
      
      // Check if it's a trauma-related diagnosis
      const traumaDiagnoses = [
        "Trauma - Multiple",
        "Trauma - Head Injury",
        "Trauma - Spinal Injury",
        "Trauma - Fracture",
        "Motor Vehicle Accident",
        "Fall Injury",
        "Burn Injury"
      ];
      
      console.log('Selected diagnosis:', diagnosis);
      console.log('Is trauma diagnosis:', traumaDiagnoses.includes(diagnosis));
      
      if (traumaDiagnoses.includes(diagnosis)) {
        console.log('Trauma diagnosis detected:', diagnosis);
        // Show trauma diagram after a short delay
        setTimeout(() => {
          console.log('Showing trauma diagram prompt');
          Alert.alert(
            "Document Trauma Injuries",
            "Would you like to mark injury locations on a body diagram?",
            [
              { text: "Not Now", style: "cancel" },
              { 
                text: "Yes", 
                onPress: () => {
                  console.log('User selected Yes, opening trauma diagram');
                  setShowTraumaDiagram(true);
                }
              }
            ]
          );
        }, 300);
      } else {
        console.log('Non-trauma diagnosis selected:', diagnosis);
      }
    }
  }, [updateIncidentInfo]);

  const handleCustomDiagnosisSubmit = useCallback(() => {
    if (customDiagnosis.trim()) {
      updateIncidentInfo({ provisionalDiagnosis: `Others: ${customDiagnosis.trim()}` });
      setShowDiagnosisModal(false);
      setShowCustomDiagnosisInput(false);
    } else {
      Alert.alert("Required", "Please enter a provisional diagnosis");
    }
  }, [customDiagnosis, updateIncidentInfo]);

  const handleOthersInputChange = useCallback((text: string) => {
    setCustomDiagnosis(text);
    if (text.trim()) {
      updateIncidentInfo({ provisionalDiagnosis: `Others: ${text.trim()}` });
    } else {
      updateIncidentInfo({ provisionalDiagnosis: "Others" });
    }
  }, [updateIncidentInfo]);

  const handleAdminLogin = useCallback(() => {
    if (adminLogin(adminPassword)) {
      setShowAdminLogin(false);
      setAdminPassword('');
      Alert.alert('Success', 'Admin mode enabled! You can now access the Admin tab.');
    } else {
      Alert.alert('Error', 'Invalid admin password');
    }
  }, [adminLogin, adminPassword]);

  return (
    <ResponsiveContainer maxWidth="large" padding="medium">
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
          automaticallyAdjustKeyboardInsets={true}
        >
        {/* Offline Status Component */}
        <OfflineStatus 
          showDetails={showOfflineDetails} 
          onToggleDetails={() => setShowOfflineDetails(!showOfflineDetails)} 
        />
        
        <View style={styles.headerSection}>
        <View style={styles.brandingContainer}>
          <View style={styles.logoContainer}>
            <Shield size={32} color="#0066CC" />
            <Text style={styles.brandName}>MediCare Pro</Text>
          </View>
          <Text style={styles.tagline}>Professional ePCR System</Text>
        </View>
        <Text style={styles.headerTitle}>New Patient Care Report</Text>
        <Text style={styles.headerSubtitle}>Complete digital documentation for emergency medical services</Text>
        
        {!isAdmin ? (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => setShowAdminLogin(true)}
          >
            <Shield size={16} color="#666" />
            <Text style={styles.adminButtonText}>Admin Access</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.adminBadge}>
            <Shield size={16} color="#28a745" />
            <Text style={styles.adminBadgeText}>Admin Mode Active</Text>
          </View>
        )}
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Call Time Information</Text>
        </View>
        
        <View style={styles.callTimeGrid}>
          <View style={styles.callTimeRow}>
            <View style={styles.callTimeItem}>
              <Text style={styles.callTimeLabel}>Date</Text>
              <TextInput
                style={styles.callTimeInput}
                value={callTimeInfo.date}
                onChangeText={handleCallTimeChange('date')}
                placeholder="DD/MM/YYYY"
              />
            </View>
            <View style={styles.callTimeItem}>
              <Text style={styles.callTimeLabel}>Time of Call</Text>
              <TextInput
                style={styles.callTimeInput}
                value={callTimeInfo.timeOfCall}
                onChangeText={handleCallTimeChange('timeOfCall')}
                placeholder="HH:MM"
              />
            </View>
          </View>
          
          <View style={styles.callTimeRow}>
            <View style={styles.callTimeItem}>
              <Text style={styles.callTimeLabel}>Arrival on Scene</Text>
              <TextInput
                style={styles.callTimeInput}
                value={callTimeInfo.arrivalOnScene}
                onChangeText={handleCallTimeChange('arrivalOnScene')}
                placeholder="HH:MM"
              />
            </View>
            <View style={styles.callTimeItem}>
              <Text style={styles.callTimeLabel}>At Patient Side</Text>
              <TextInput
                style={styles.callTimeInput}
                value={callTimeInfo.atPatientSide}
                onChangeText={handleCallTimeChange('atPatientSide')}
                placeholder="HH:MM"
              />
            </View>
          </View>
          
          <View style={styles.callTimeRow}>
            <View style={styles.callTimeItem}>
              <Text style={styles.callTimeLabel}>To Destination</Text>
              <TextInput
                style={styles.callTimeInput}
                value={callTimeInfo.toDestination}
                onChangeText={handleCallTimeChange('toDestination')}
                placeholder="HH:MM"
              />
            </View>
            <View style={styles.callTimeItem}>
              <Text style={styles.callTimeLabel}>At Destination</Text>
              <TextInput
                style={styles.callTimeInput}
                value={callTimeInfo.atDestination}
                onChangeText={handleCallTimeChange('atDestination')}
                placeholder="HH:MM"
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Patient Information</Text>
        </View>
        
        <ResponsiveRow gap={spacing.md} wrap={isTablet()}>
          <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={patientInfo.firstName}
              onChangeText={handlePatientChange('firstName')}
              placeholder="Enter first name"
            />
          </View>
          <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={patientInfo.lastName}
              onChangeText={handlePatientChange('lastName')}
              placeholder="Enter last name"
            />
          </View>
        </ResponsiveRow>

        <ResponsiveRow gap={spacing.md} wrap={isTablet()}>
          <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={patientInfo.age}
              onChangeText={handlePatientChange('age')}
              placeholder="Age"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  patientInfo.gender === "Male" && styles.genderButtonActive,
                ]}
                onPress={() => handleGenderSelect("Male")}
              >
                <Text
                  style={[
                    styles.genderText,
                    patientInfo.gender === "Male" && styles.genderTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  patientInfo.gender === "Female" && styles.genderButtonActive,
                ]}
                onPress={() => handleGenderSelect("Female")}
              >
                <Text
                  style={[
                    styles.genderText,
                    patientInfo.gender === "Female" && styles.genderTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ResponsiveRow>

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={patientInfo.phone}
          onChangeText={handlePatientChange('phone')}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Medical Record Number</Text>
        <TextInput
          style={styles.input}
          value={patientInfo.mrn}
          onChangeText={handlePatientChange('mrn')}
          placeholder="Enter MRN if available"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Incident Information</Text>
        </View>

        <Text style={styles.label}>Incident Location</Text>
        <TextInput
          style={styles.input}
          value={incidentInfo.location}
          onChangeText={handleIncidentChange('location')}
          placeholder="Enter incident address"
          multiline
        />

        <Text style={styles.label}>On Arrival Information</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={incidentInfo.onArrivalInfo}
          onChangeText={handleIncidentChange('onArrivalInfo')}
          placeholder="Patient condition on arrival, initial observations, scene assessment"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Chief Complaint</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={incidentInfo.chiefComplaint}
          onChangeText={handleIncidentChange('chiefComplaint')}
          placeholder="Describe the primary complaint"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>History</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={incidentInfo.history}
          onChangeText={handleIncidentChange('history')}
          placeholder="Patient medical history, medications, allergies, and relevant background information"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Assessment</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={incidentInfo.assessment}
          onChangeText={handleIncidentChange('assessment')}
          placeholder="Clinical assessment, findings, and working diagnosis"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Treatment Given</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={incidentInfo.treatmentGiven}
          onChangeText={handleIncidentChange('treatmentGiven')}
          placeholder="Interventions, medications administered, procedures performed"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Call Priority</Text>
        <View style={styles.priorityContainer}>
          {priorityOptions.map((priority) => {
            const isActive = incidentInfo.priority === priority;
            const isEmergency = priority === "Emergency" && isActive;
            return (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityButton,
                  isActive && styles.priorityButtonActive,
                  isEmergency && styles.emergencyActive,
                ]}
                onPress={() => handlePrioritySelect(priority)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    isActive && styles.priorityTextActive,
                  ]}
                >
                  {priority}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Provisional Diagnosis</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowDiagnosisModal(true)}
        >
          <Text style={[
            styles.dropdownText,
            !incidentInfo.provisionalDiagnosis && styles.placeholderText
          ]}>
            {incidentInfo.provisionalDiagnosis || "Select provisional diagnosis"}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
        
        {showOthersInput && (
          <View style={styles.othersInputContainer}>
            <Text style={styles.othersInputLabel}>Specify Other Diagnosis</Text>
            <TextInput
              style={[styles.input, styles.othersTextArea]}
              value={customDiagnosis}
              onChangeText={handleOthersInputChange}
              placeholder="Enter your provisional diagnosis here"
              multiline
              numberOfLines={3}
            />
          </View>
        )}
        
        {/* Trauma Injuries Section */}
        {incidentInfo.traumaInjuries && incidentInfo.traumaInjuries.length > 0 && (
          <View style={styles.traumaSection}>
            <View style={styles.traumaHeader}>
              <Activity size={16} color="#DC3545" />
              <Text style={styles.traumaTitle}>Documented Injuries ({incidentInfo.traumaInjuries.length})</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewTraumaButton}
              onPress={() => setShowTraumaDiagram(true)}
            >
              <Text style={styles.viewTraumaButtonText}>View/Edit Body Diagram</Text>
            </TouchableOpacity>
            <View style={styles.traumaList}>
              {incidentInfo.traumaInjuries.slice(0, 3).map((injury) => (
                <View key={injury.id} style={styles.traumaItem}>
                  <View style={[
                    styles.traumaSeverityIndicator,
                    { backgroundColor: 
                      injury.severity === 'critical' ? '#D32F2F' :
                      injury.severity === 'severe' ? '#FF5722' :
                      injury.severity === 'moderate' ? '#FF9800' : '#FFC107'
                    }
                  ]} />
                  <View style={styles.traumaItemContent}>
                    <Text style={styles.traumaBodyPart}>{injury.bodyPart}</Text>
                    <Text style={styles.traumaDescription} numberOfLines={1}>{injury.description}</Text>
                  </View>
                </View>
              ))}
              {incidentInfo.traumaInjuries.length > 3 && (
                <Text style={styles.moreTraumaText}>+{incidentInfo.traumaInjuries.length - 3} more injuries</Text>
              )}
            </View>
          </View>
        )}
        
        {/* Manual Trauma Diagram Access */}
        <View style={styles.traumaAccessSection}>
          <Text style={styles.traumaAccessLabel}>Injury Documentation</Text>
          <TouchableOpacity 
            style={styles.traumaAccessButton}
            onPress={() => {
              console.log('Manual trauma diagram button pressed');
              setShowTraumaDiagram(true);
            }}
          >
            <Activity size={16} color="#DC3545" />
            <Text style={styles.traumaAccessButtonText}>Open Body Diagram</Text>
          </TouchableOpacity>
          <Text style={styles.traumaAccessDescription}>
            Use the body diagram to mark and document injury locations for any patient
          </Text>
        </View>
        
        <Text style={styles.label}>Additional Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={incidentInfo.additionalNotes}
          onChangeText={handleIncidentChange('additionalNotes')}
          placeholder="Any additional notes, observations, or important information not covered above"
          multiline
          numberOfLines={4}
        />
      </View>

      <Modal
        visible={showDiagnosisModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Provisional Diagnosis</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowDiagnosisModal(false);
                setShowCustomDiagnosisInput(false);
                if (!showOthersInput) {
                  setCustomDiagnosis("");
                }
              }}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          {showCustomDiagnosisInput ? (
            <View style={styles.customInputContainer}>
              <Text style={styles.customInputLabel}>Enter Custom Diagnosis</Text>
              <TextInput
                style={styles.customInput}
                value={customDiagnosis}
                onChangeText={setCustomDiagnosis}
                placeholder="Type your provisional diagnosis here"
                multiline
                numberOfLines={3}
                autoFocus
              />
              <View style={styles.customInputButtons}>
                <TouchableOpacity
                  style={styles.customInputButton}
                  onPress={() => {
                    setShowCustomDiagnosisInput(false);
                    setCustomDiagnosis("");
                  }}
                >
                  <Text style={styles.customInputButtonTextCancel}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.customInputButton, styles.customInputButtonSubmit]}
                  onPress={handleCustomDiagnosisSubmit}
                >
                  <Text style={styles.customInputButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <FlatList
              data={provisionalDiagnosisOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.diagnosisOption,
                    incidentInfo.provisionalDiagnosis === item && styles.selectedDiagnosisOption
                  ]}
                  onPress={() => handleDiagnosisSelect(item)}
                >
                  <Text style={[
                    styles.diagnosisOptionText,
                    incidentInfo.provisionalDiagnosis === item && styles.selectedDiagnosisOptionText
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={showAdminLogin}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdminLogin(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.adminModalContent}>
            <View style={styles.adminModalHeader}>
              <Shield size={24} color="#0066CC" />
              <Text style={styles.adminModalTitle}>Admin Login</Text>
            </View>
            
            <Text style={styles.adminModalDescription}>
              Enter the admin password to access stored PCR data and admin features.
            </Text>
            
            <TextInput
              style={styles.adminPasswordInput}
              placeholder="Admin Password"
              value={adminPassword}
              onChangeText={setAdminPassword}
              secureTextEntry
              autoFocus
            />
            
            <View style={styles.adminModalButtons}>
              <TouchableOpacity
                style={styles.adminCancelButton}
                onPress={() => {
                  setShowAdminLogin(false);
                  setAdminPassword('');
                }}
              >
                <Text style={styles.adminCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.adminLoginButton}
                onPress={handleAdminLogin}
              >
                <Text style={styles.adminLoginButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.adminHintText}>
              Hint: Default password is "admin123"
            </Text>
          </View>
        </View>
      </Modal>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.voiceButton} 
          onPress={() => setShowVoiceNotes(true)}
        >
          <Mic size={20} color="#fff" />
          <Text style={styles.voiceButtonText}>Voice Notes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTab}>
          <Text style={styles.saveButtonText}>Save Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReport}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      <VoiceNotesModal
        visible={showVoiceNotes}
        onClose={() => setShowVoiceNotes(false)}
        onTranscriptionComplete={(transcription, analysis) => {
          console.log('Voice note transcribed:', transcription);
          if (analysis) {
            console.log('AI analysis:', analysis);
          }
        }}
      />
      
      <TraumaBodyDiagram
        visible={showTraumaDiagram}
        onClose={() => setShowTraumaDiagram(false)}
        onSave={(injuries) => {
          updateIncidentInfo({ traumaInjuries: injuries });
          if (injuries.length > 0) {
            Alert.alert(
              "Injuries Documented",
              `${injuries.length} injury location${injuries.length > 1 ? 's' : ''} have been recorded.`
            );
          }
        }}
        existingInjuries={incidentInfo.traumaInjuries}
      />
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    minHeight: 44,
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 0.48,
  },
  genderContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    alignItems: "center",
    marginRight: 8,
    borderRadius: 8,
  },
  genderButtonActive: {
    backgroundColor: "#0066CC",
    borderColor: "#0066CC",
  },
  genderText: {
    fontSize: 14,
    color: "#666",
  },
  genderTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  priorityContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    alignItems: "center",
    marginRight: 8,
    borderRadius: 8,
  },
  priorityButtonActive: {
    backgroundColor: "#0066CC",
    borderColor: "#0066CC",
  },
  emergencyActive: {
    backgroundColor: "#DC3545",
    borderColor: "#DC3545",
  },
  priorityText: {
    fontSize: 14,
    color: "#666",
  },
  priorityTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    margin: 16,
    gap: 8,
  },
  voiceButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  voiceButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#28A745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#0066CC",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 100,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#0066CC",
    fontWeight: "500",
  },
  diagnosisOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedDiagnosisOption: {
    backgroundColor: "#E3F2FD",
  },
  diagnosisOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedDiagnosisOptionText: {
    color: "#0066CC",
    fontWeight: "500",
  },
  customInputContainer: {
    padding: 20,
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  customInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    minHeight: 80,
    textAlignVertical: "top",
  },
  customInputButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  customInputButton: {
    flex: 0.48,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  customInputButtonSubmit: {
    backgroundColor: "#0066CC",
  },
  customInputButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  customInputButtonTextCancel: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  othersInputContainer: {
    marginTop: -8,
    marginBottom: 16,
  },
  othersInputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  othersTextArea: {
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: "#F8F9FA",
    borderColor: "#0066CC",
    borderWidth: 1.5,
  },
  headerSection: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderTopWidth: 4,
    borderTopColor: "#0066CC",
  },
  brandingContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  brandName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0066CC",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
    lineHeight: 20,
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  adminButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4edda",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#c3e6cb",
  },
  adminBadgeText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#155724",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  adminModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  adminModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  adminModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  adminModalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  adminPasswordInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  adminModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  adminCancelButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  adminCancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  adminLoginButton: {
    flex: 1,
    backgroundColor: "#0066CC",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  adminLoginButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  adminHintText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 15,
    fontStyle: "italic",
  },
  inputContainer: {
    flex: 1,
    minWidth: 150,
    marginBottom: 16,
  },
  tabletInput: {
    minWidth: 200,
    maxWidth: 300,
  },
  twoColumnContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  callTimeGrid: {
    marginBottom: 16,
  },
  callTimeRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  callTimeItem: {
    flex: 1,
  },
  callTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  callTimeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 44,
    color: '#333',
    textAlign: 'center',
  },
  traumaSection: {
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  traumaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  traumaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC3545',
    marginLeft: 6,
  },
  viewTraumaButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewTraumaButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  traumaList: {
    marginTop: 4,
  },
  traumaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  traumaSeverityIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 8,
  },
  traumaItemContent: {
    flex: 1,
  },
  traumaBodyPart: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  traumaDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  moreTraumaText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  traumaAccessSection: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  traumaAccessLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 8,
  },
  traumaAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC3545',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  traumaAccessButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  traumaAccessDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});
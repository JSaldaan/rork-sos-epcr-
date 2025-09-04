import React, { useCallback, useMemo, useState, useEffect } from "react";
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
} from "react-native";
import { Clock, MapPin, User, ChevronDown, Shield } from "lucide-react-native";
import { usePCRStore } from "@/store/pcrStore";
import { router } from "expo-router";

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
    submitPCR,
    currentSession,
  } = usePCRStore();
  const [showDiagnosisModal, setShowDiagnosisModal] = useState<boolean>(false);
  const [showCustomDiagnosisInput, setShowCustomDiagnosisInput] = useState<boolean>(false);
  const [customDiagnosis, setCustomDiagnosis] = useState<string>("");
  const [showOthersInput, setShowOthersInput] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');

  const { saveCurrentPCRDraft, saveTabDataWithNotification } = usePCRStore();
  
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

  const handleSavePatient = useCallback(async () => {
    if (!patientInfo.firstName || !patientInfo.lastName) {
      Alert.alert("Required Fields", "Please enter patient's first and last name");
      return;
    }
    
    try {
      await saveCurrentPCRDraft();
      console.log('Patient information saved to draft');
      Alert.alert("Success", "Patient information saved successfully. Continue to other tabs to complete the PCR.");
    } catch (error) {
      console.error('Error saving patient data:', error);
      Alert.alert("Error", "Failed to save patient information. Please try again.");
    }
  }, [patientInfo.firstName, patientInfo.lastName, saveCurrentPCRDraft]);

  const handleSaveTab = useCallback(async () => {
    try {
      await saveTabDataWithNotification('Patient Info');
      Alert.alert("Success", "Patient information saved successfully!");
    } catch (error) {
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
            } catch (error) {
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Offline Status Component */}
      <OfflineStatus 
        showDetails={showOfflineDetails} 
        onToggleDetails={() => setShowOfflineDetails(!showOfflineDetails)} 
      />
      
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>New Patient Care Report</Text>
        <Text style={styles.headerSubtitle}>Enter patient and call information</Text>
        
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
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Time of Call</Text>
            <TextInput
              style={styles.input}
              value={callTimeInfo.timeOfCall}
              onChangeText={handleCallTimeChange('timeOfCall')}
              placeholder="HH:MM"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={callTimeInfo.date}
              onChangeText={handleCallTimeChange('date')}
              placeholder="DD/MM/YYYY"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Arrival on Scene</Text>
            <TextInput
              style={styles.input}
              value={callTimeInfo.arrivalOnScene}
              onChangeText={handleCallTimeChange('arrivalOnScene')}
              placeholder="HH:MM"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>At Patient Side</Text>
            <TextInput
              style={styles.input}
              value={callTimeInfo.atPatientSide}
              onChangeText={handleCallTimeChange('atPatientSide')}
              placeholder="HH:MM"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>To Destination</Text>
            <TextInput
              style={styles.input}
              value={callTimeInfo.toDestination}
              onChangeText={handleCallTimeChange('toDestination')}
              placeholder="HH:MM"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>At Destination</Text>
            <TextInput
              style={styles.input}
              value={callTimeInfo.atDestination}
              onChangeText={handleCallTimeChange('atDestination')}
              placeholder="HH:MM"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Patient Information</Text>
        </View>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={patientInfo.firstName}
              onChangeText={handlePatientChange('firstName')}
              placeholder="Enter first name"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={patientInfo.lastName}
              onChangeText={handlePatientChange('lastName')}
              placeholder="Enter last name"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={patientInfo.age}
              onChangeText={handlePatientChange('age')}
              placeholder="Age"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
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
        </View>

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
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTab}>
          <Text style={styles.saveButtonText}>Save Patient Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReport}>
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
    marginBottom: 16,
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
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#28A745",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#0066CC",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 20,
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
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
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
});
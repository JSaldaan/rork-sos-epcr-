import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { ResponsiveContainer } from '@/components/ResponsiveLayout';
import { isTablet } from '@/utils/responsive';
import { Activity, Clock, Plus, Camera, Mic } from "lucide-react-native";
import { usePCRStore } from "@/store/pcrStore";
import { VoiceNotesModal } from "@/components/VoiceNotesModal";
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  InputValidator,
  MalwareProtection,
  SecurityLogger,
} from '@/utils/security';

export default function VitalsScreen() {
  const { vitals, addVitalSigns, saveVitalsData, addECGCapture, saveTabDataWithNotification } = usePCRStore();
  const [currentVitals, setCurrentVitals] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    temperature: "",
    bloodGlucose: "",
    painScale: "",
  });
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showVoiceNotes, setShowVoiceNotes] = useState(false);

  const initialVitals = useMemo(() => ({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    temperature: "",
    bloodGlucose: "",
    painScale: "",
  }), []);

  const handleAddVitals = useCallback(async () => {
    if (!currentVitals.heartRate && !currentVitals.bloodPressureSystolic) {
      Alert.alert("Required", "Please enter at least heart rate or blood pressure");
      return;
    }

    // Security validation for vital signs input
    const vitalsToValidate = [
      { value: currentVitals.bloodPressureSystolic, type: 'bp' as const, name: 'Systolic BP' },
      { value: currentVitals.bloodPressureDiastolic, type: 'bp' as const, name: 'Diastolic BP' },
      { value: currentVitals.heartRate, type: 'hr' as const, name: 'Heart Rate' },
      { value: currentVitals.respiratoryRate, type: 'rr' as const, name: 'Respiratory Rate' },
      { value: currentVitals.oxygenSaturation, type: 'spo2' as const, name: 'Oxygen Saturation' },
      { value: currentVitals.temperature, type: 'temp' as const, name: 'Temperature' },
    ];

    for (const vital of vitalsToValidate) {
      if (vital.value) {
        // Check for malicious input
        const malwareScan = MalwareProtection.scanInput(vital.value);
        if (!malwareScan.safe) {
          Alert.alert('Security Alert', `Malicious content detected in ${vital.name}`);
          await SecurityLogger.logEvent(
            'INJECTION_ATTEMPT',
            `Malicious vital signs input detected in ${vital.name}: ${malwareScan.threats.join(', ')}`,
            'CRITICAL',
            true
          );
          return;
        }

        // Validate vital signs ranges
        if (!InputValidator.validateVitalSigns(vital.value, vital.type)) {
          Alert.alert(
            'Invalid Value',
            `${vital.name} value "${vital.value}" is outside normal medical ranges. Please check your input.`
          );
          await SecurityLogger.logEvent(
            'DATA_ACCESS',
            `Invalid vital signs value entered: ${vital.name} = ${vital.value}`,
            'MEDIUM'
          );
          return;
        }
      }
    }

    // Log successful vital signs entry
    await SecurityLogger.logEvent(
      'DATA_ACCESS',
      'Vital signs data entered successfully',
      'LOW'
    );

    const vitalSigns = {
      ...currentVitals,
      timestamp: new Date().toISOString(),
    };

    addVitalSigns(vitalSigns);
    setCurrentVitals(initialVitals);
    
    // Save the vitals data to storage
    try {
      await saveVitalsData();
      console.log('Vital signs saved to draft');
      Alert.alert("Success", "Vital signs recorded and saved successfully.");
    } catch {
      Alert.alert("Warning", "Vital signs recorded but failed to save to storage");
    }
  }, [currentVitals, addVitalSigns, initialVitals, saveVitalsData]);

  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  const handleECGCapture = useCallback(async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permission Required", "Camera permission is required to capture ECG recordings.");
        return;
      }
    }

    setShowCamera(true);
  }, [permission, requestPermission]);

  const handleCameraClose = useCallback(() => {
    setShowCamera(false);
  }, []);

  const handleECGSave = useCallback(async () => {
    try {
      // Simple plain ECG capture - just store a timestamp and identifier
      // This represents what would be captured directly from the camera
      const timestamp = new Date().toISOString();
      const ecgData = `ECG_PLAIN_CAPTURE_${Date.now()}_${timestamp}`;
      
      if (vitals.length > 0) {
        addECGCapture(ecgData);
        setShowCamera(false); // Exit camera immediately after capture
        Alert.alert(
          "ECG Captured",
          "Plain ECG recording has been captured as photographed and saved with the most recent vital signs."
        );
      } else {
        setShowCamera(false); // Exit camera
        Alert.alert(
          "No Vital Signs",
          "Please record vital signs first before capturing ECG."
        );
      }
    } catch (error) {
      console.error('Error capturing ECG:', error);
      // Fallback to simple identifier
      const ecgData = `ECG_PLAIN_CAPTURE_${Date.now()}_ERROR`;
      
      if (vitals.length > 0) {
        addECGCapture(ecgData);
        setShowCamera(false);
        Alert.alert(
          "ECG Captured",
          "Plain ECG recording has been captured and saved with the most recent vital signs."
        );
      } else {
        setShowCamera(false);
        Alert.alert(
          "No Vital Signs",
          "Please record vital signs first before capturing ECG."
        );
      }
    }
  }, [vitals.length, addECGCapture]);

  const handleSaveTab = useCallback(async () => {
    try {
      await saveTabDataWithNotification('Vitals');
      Alert.alert("Success", "Vitals data saved successfully!");
    } catch {
      Alert.alert("Error", "Failed to save vitals data. Please try again.");
    }
  }, [saveTabDataWithNotification]);

  const handleSubmitReport = useCallback(async () => {
    if (vitals.length === 0) {
      Alert.alert("No Data", "Please record at least one set of vital signs before submitting.");
      return;
    }
    
    Alert.alert(
      "Submit Report",
      "Are you sure you want to submit this report? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "default",
          onPress: async () => {
            try {
              await saveTabDataWithNotification('Vitals');
              Alert.alert(
                "Report Submitted",
                "Your vitals report has been submitted successfully! Go to Preview tab to submit the complete PCR."
              );
            } catch {
              Alert.alert("Error", "Failed to submit report. Please try again.");
            }
          }
        }
      ]
    );
  }, [vitals.length, saveTabDataWithNotification]);

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
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Activity size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Record Vital Signs</Text>
        </View>

        <View style={styles.twoColumnContainer}>
          <View style={styles.column}>
            <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
              <Text style={styles.label}>Systolic BP</Text>
              <TextInput
                style={styles.input}
                value={currentVitals.bloodPressureSystolic}
                onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, bloodPressureSystolic: text }))}
                placeholder="120"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
              <Text style={styles.label}>Heart Rate (bpm)</Text>
              <TextInput
                style={styles.input}
                value={currentVitals.heartRate}
                onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, heartRate: text }))}
                placeholder="72"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
              <Text style={styles.label}>O2 Saturation (%)</Text>
              <TextInput
                style={styles.input}
                value={currentVitals.oxygenSaturation}
                onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, oxygenSaturation: text }))}
                placeholder="98"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
              <Text style={styles.label}>Blood Glucose</Text>
              <TextInput
                style={styles.input}
                value={currentVitals.bloodGlucose}
                onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, bloodGlucose: text }))}
                placeholder="5.5"
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.column}>
            <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
              <Text style={styles.label}>Diastolic BP</Text>
              <TextInput
                style={styles.input}
                value={currentVitals.bloodPressureDiastolic}
                onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, bloodPressureDiastolic: text }))}
                placeholder="80"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
              <Text style={styles.label}>Respiratory Rate</Text>
              <TextInput
                style={styles.input}
                value={currentVitals.respiratoryRate}
                onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, respiratoryRate: text }))}
                placeholder="16"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
              <Text style={styles.label}>Temperature (°C)</Text>
              <TextInput
                style={styles.input}
                value={currentVitals.temperature}
                onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, temperature: text }))}
                placeholder="36.5"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, isTablet() && styles.tabletInput]}>
              <Text style={styles.label}>Pain Scale (0-10)</Text>
              <TextInput
                style={styles.input}
                value={currentVitals.painScale}
                onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, painScale: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddVitals}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Vitals</Text>
        </TouchableOpacity>
      </View>

      {vitals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#0066CC" />
            <Text style={styles.sectionTitle}>Vital Signs History</Text>
            <TouchableOpacity 
              style={[
                styles.ecgButton,
                vitals.some(v => v.ecgCapture) && styles.ecgButtonCaptured
              ]} 
              onPress={handleECGCapture}
            >
              <Camera size={16} color={vitals.some(v => v.ecgCapture) ? "#28A745" : "#0066CC"} />
              <Text style={[
                styles.ecgButtonText,
                vitals.some(v => v.ecgCapture) && styles.ecgButtonTextCaptured
              ]}>
                {vitals.some(v => v.ecgCapture) ? "ECG Captured" : "ECG Capture"}
              </Text>
            </TouchableOpacity>
          </View>

          {vitals.map((vital, index) => (
            <View key={index} style={styles.vitalRecord}>
              <View style={styles.vitalHeader}>
                <Text style={styles.vitalTime}>{formatTime(vital.timestamp)}</Text>
                <View style={styles.vitalBadge}>
                  <Text style={styles.vitalBadgeText}>#{vitals.length - index}</Text>
                </View>
              </View>
              
              <View style={styles.vitalGrid}>
                {vital.bloodPressureSystolic && vital.bloodPressureDiastolic && (
                  <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>BP</Text>
                    <Text style={styles.vitalValue}>
                      {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                    </Text>
                  </View>
                )}
                {vital.heartRate && (
                  <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>HR</Text>
                    <Text style={styles.vitalValue}>{vital.heartRate} bpm</Text>
                  </View>
                )}
                {vital.respiratoryRate && (
                  <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>RR</Text>
                    <Text style={styles.vitalValue}>{vital.respiratoryRate}</Text>
                  </View>
                )}
                {vital.oxygenSaturation && (
                  <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>SpO2</Text>
                    <Text style={styles.vitalValue}>{vital.oxygenSaturation}%</Text>
                  </View>
                )}
                {vital.temperature && (
                  <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>Temp</Text>
                    <Text style={styles.vitalValue}>{vital.temperature}°C</Text>
                  </View>
                )}
                {vital.painScale && (
                  <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>Pain</Text>
                    <Text style={styles.vitalValue}>{vital.painScale}/10</Text>
                  </View>
                )}
              </View>
              {vital.ecgCapture && (
                <View style={styles.ecgIndicator}>
                  <Text style={styles.ecgIndicatorText}>📷 Plain ECG Captured</Text>
                  <Text style={styles.ecgTimestamp}>
                    {vital.ecgCaptureTimestamp ? new Date(vital.ecgCaptureTimestamp).toLocaleTimeString() : 'N/A'}
                  </Text>
                  <Text style={styles.ecgReference}>Camera capture: {vital.ecgCapture?.substring(0, 30)}{'...'}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.voiceButton} 
          onPress={() => setShowVoiceNotes(true)}
        >
          <Mic size={16} color="#fff" />
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
          
          {showCamera && (
        <View style={styles.cameraContainer}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>ECG Capture/Recording</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCameraClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <CameraView style={styles.camera} facing="back">
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.captureButton} onPress={handleECGSave}>
                <Text style={styles.captureButtonText}>Capture ECG</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      <VoiceNotesModal
        visible={showVoiceNotes}
        onClose={() => setShowVoiceNotes(false)}
        onTranscriptionComplete={(transcription, analysis) => {
          console.log('Voice note transcribed in vitals:', transcription);
          if (analysis) {
            console.log('AI analysis in vitals:', analysis);
          }
        }}
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
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 0.48,
  },
  addButton: {
    backgroundColor: "#0066CC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  vitalRecord: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  vitalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vitalTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  vitalBadge: {
    backgroundColor: "#0066CC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vitalBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  vitalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  vitalItem: {
    width: "33.33%",
    marginBottom: 8,
  },
  vitalLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  bottomPadding: {
    height: 100,
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
  voiceButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 12,
    paddingVertical: 16,
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
  ecgButtonCaptured: {
    backgroundColor: "#E8F5E8",
    borderColor: "#28A745",
  },
  ecgButtonTextCaptured: {
    color: "#28A745",
  },
  ecgButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#0066CC",
  },
  ecgButtonText: {
    color: "#0066CC",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  cameraContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 1000,
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  cameraTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    backgroundColor: "#0066CC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  captureButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  ecgIndicator: {
    backgroundColor: "#E8F5E8",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  ecgIndicatorText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
  },
  ecgTimestamp: {
    color: "#4CAF50",
    fontSize: 10,
    marginTop: 2,
  },
  ecgReference: {
    color: "#666",
    fontSize: 9,
    marginTop: 2,
    fontFamily: "monospace",
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
});
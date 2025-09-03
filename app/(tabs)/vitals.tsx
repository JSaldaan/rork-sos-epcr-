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
} from "react-native";
import { Activity, Clock, Plus, Camera } from "lucide-react-native";
import { usePCRStore } from "@/store/pcrStore";
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function VitalsScreen() {
  const { vitals, addVitalSigns, saveVitalsData, addECGCapture } = usePCRStore();
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
    } catch (error) {
      console.error('Error saving vitals:', error);
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

  const handleECGSave = useCallback(() => {
    // Simulate ECG capture data (in a real app, this would be actual ECG data)
    const ecgData = `ECG_CAPTURE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (vitals.length > 0) {
      addECGCapture(ecgData);
      Alert.alert(
        "ECG Captured",
        "ECG recording has been captured and saved with the most recent vital signs.",
        [{ text: "OK", onPress: () => setShowCamera(false) }]
      );
    } else {
      Alert.alert(
        "No Vital Signs",
        "Please record vital signs first before capturing ECG.",
        [{ text: "OK", onPress: () => setShowCamera(false) }]
      );
    }
  }, [vitals.length, addECGCapture]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Activity size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Record Vital Signs</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Systolic BP</Text>
            <TextInput
              style={styles.input}
              value={currentVitals.bloodPressureSystolic}
              onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, bloodPressureSystolic: text }))}
              placeholder="120"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Diastolic BP</Text>
            <TextInput
              style={styles.input}
              value={currentVitals.bloodPressureDiastolic}
              onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, bloodPressureDiastolic: text }))}
              placeholder="80"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Heart Rate (bpm)</Text>
            <TextInput
              style={styles.input}
              value={currentVitals.heartRate}
              onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, heartRate: text }))}
              placeholder="72"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Respiratory Rate</Text>
            <TextInput
              style={styles.input}
              value={currentVitals.respiratoryRate}
              onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, respiratoryRate: text }))}
              placeholder="16"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>O2 Saturation (%)</Text>
            <TextInput
              style={styles.input}
              value={currentVitals.oxygenSaturation}
              onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, oxygenSaturation: text }))}
              placeholder="98"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Temperature (°C)</Text>
            <TextInput
              style={styles.input}
              value={currentVitals.temperature}
              onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, temperature: text }))}
              placeholder="36.5"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Blood Glucose</Text>
            <TextInput
              style={styles.input}
              value={currentVitals.bloodGlucose}
              onChangeText={(text) => setCurrentVitals(prev => ({ ...prev, bloodGlucose: text }))}
              placeholder="5.5"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
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

        <TouchableOpacity style={styles.addButton} onPress={handleAddVitals}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Save Vitals</Text>
        </TouchableOpacity>
      </View>

      {vitals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#0066CC" />
            <Text style={styles.sectionTitle}>Vital Signs History</Text>
            <TouchableOpacity style={styles.ecgButton} onPress={handleECGCapture}>
              <Camera size={16} color="#0066CC" />
              <Text style={styles.ecgButtonText}>ECG Capture</Text>
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
                  <Text style={styles.ecgIndicatorText}>📈 ECG Captured</Text>
                  <Text style={styles.ecgTimestamp}>
                    {vital.ecgCaptureTimestamp ? new Date(vital.ecgCaptureTimestamp).toLocaleTimeString() : 'N/A'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

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
    height: 20,
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
});
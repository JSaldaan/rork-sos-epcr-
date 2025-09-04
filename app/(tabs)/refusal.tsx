import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { usePCRStore } from "@/store/pcrStore";
import { AlertTriangle, FileX, Check } from "lucide-react-native";
import SignatureModal from "@/components/SignatureModal";

export default function RefusalForm() {
  const { refusalInfo, updateRefusalInfo, patientInfo, saveRefusalData, saveTabDataWithNotification } = usePCRStore();
  const [activeSignature, setActiveSignature] = useState<string | null>(null);

  const handleSaveSignature = (field: string, signature: string) => {
    updateRefusalInfo({ [field]: signature });
    setActiveSignature(null);
  };

  const handleClearSignature = (field: string) => {
    Alert.alert(
      "Clear Signature",
      "Are you sure you want to clear this signature?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            updateRefusalInfo({ [field]: "", [`${field}Paths`]: "" });
          },
        },
      ]
    );
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const handleSetCurrentDateTime = () => {
    const { date, time } = getCurrentDateTime();
    updateRefusalInfo({
      dateOfRefusal: date,
      timeOfRefusal: time,
    });
  };

  const validateForm = () => {
    if (!refusalInfo.patientName) {
      Alert.alert("Error", "Patient name is required");
      return false;
    }
    if (!refusalInfo.dateOfRefusal || !refusalInfo.timeOfRefusal) {
      Alert.alert("Error", "Date and time of refusal are required");
      return false;
    }
    if (!refusalInfo.reasonForRefusal) {
      Alert.alert("Error", "Reason for refusal is required");
      return false;
    }
    if (!refusalInfo.patientSignature) {
      Alert.alert("Error", "Patient signature is required");
      return false;
    }
    if (!refusalInfo.paramedicSignature) {
      Alert.alert("Error", "Paramedic signature is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await saveRefusalData();
        Alert.alert("Success", "Refusal form has been saved successfully");
      } catch (error) {
        console.error('Error saving refusal data:', error);
        Alert.alert("Error", "Failed to save refusal form");
      }
    }
  };

  const handleSaveTab = async () => {
    try {
      await saveTabDataWithNotification('Refusal');
      Alert.alert("Success", "Refusal data saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save refusal data. Please try again.");
    }
  };

  const handleSubmitReport = async () => {
    if (!validateForm()) {
      return;
    }
    
    Alert.alert(
      "Submit Refusal Report",
      "Are you sure you want to submit this refusal report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "default",
          onPress: async () => {
            try {
              await saveTabDataWithNotification('Refusal');
              Alert.alert(
                "Refusal Report Submitted",
                "Your refusal report has been submitted successfully!"
              );
            } catch (error) {
              Alert.alert("Error", "Failed to submit refusal report. Please try again.");
            }
          }
        }
      ]
    );
  };

  React.useEffect(() => {
    if (patientInfo.firstName || patientInfo.lastName) {
      const fullName = `${patientInfo.firstName} ${patientInfo.lastName}`.trim();
      if (fullName !== refusalInfo.patientName) {
        updateRefusalInfo({ patientName: fullName });
      }
    }
  }, [patientInfo.firstName, patientInfo.lastName]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <FileX size={24} color="#DC2626" />
        <Text style={styles.headerTitle}>Patient Refusal Form</Text>
      </View>

      <View style={styles.warningCard}>
        <AlertTriangle size={20} color="#DC2626" />
        <Text style={styles.warningText}>
          This form documents the patient's refusal of medical treatment or transport
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Patient Name *</Text>
          <TextInput
            style={styles.input}
            value={refusalInfo.patientName}
            onChangeText={(text) => updateRefusalInfo({ patientName: text })}
            placeholder="Enter patient full name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Date of Refusal *</Text>
            <TextInput
              style={styles.input}
              value={refusalInfo.dateOfRefusal}
              onChangeText={(text) => updateRefusalInfo({ dateOfRefusal: text })}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Time of Refusal *</Text>
            <TextInput
              style={styles.input}
              value={refusalInfo.timeOfRefusal}
              onChangeText={(text) => updateRefusalInfo({ timeOfRefusal: text })}
              placeholder="HH:MM"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={handleSetCurrentDateTime}
        >
          <Text style={styles.dateTimeButtonText}>Use Current Date & Time</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Refusal Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reason for Refusal *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={refusalInfo.reasonForRefusal}
            onChangeText={(text) => updateRefusalInfo({ reasonForRefusal: text })}
            placeholder="Describe the reason for refusal"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            Risks and consequences explained to patient
          </Text>
          <Switch
            value={refusalInfo.risksExplained}
            onValueChange={(value) => updateRefusalInfo({ risksExplained: value })}
            trackColor={{ false: "#E5E5E5", true: "#0066CC" }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            Patient has mental capacity to refuse
          </Text>
          <Switch
            value={refusalInfo.mentalCapacity}
            onValueChange={(value) => updateRefusalInfo({ mentalCapacity: value })}
            trackColor={{ false: "#E5E5E5", true: "#0066CC" }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={refusalInfo.additionalNotes}
            onChangeText={(text) => updateRefusalInfo({ additionalNotes: text })}
            placeholder="Any additional information"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Signatures</Text>
        
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Patient Signature *</Text>
          {refusalInfo.patientSignature ? (
            <View style={styles.signaturePreview}>
              <Text style={styles.signedText}>✓ Signed</Text>
              <TouchableOpacity
                onPress={() => handleClearSignature("patientSignature")}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signButton}
              onPress={() => setActiveSignature("patientSignature")}
            >
              <Text style={styles.signButtonText}>Add Signature</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Witness Information</Text>
          <TextInput
            style={[styles.input, { marginBottom: 12 }]}
            value={refusalInfo.witnessName}
            onChangeText={(text) => updateRefusalInfo({ witnessName: text })}
            placeholder="Witness name (optional)"
            placeholderTextColor="#999"
          />
          
          {refusalInfo.witnessSignature ? (
            <View style={styles.signaturePreview}>
              <Text style={styles.signedText}>✓ Signed</Text>
              <TouchableOpacity
                onPress={() => handleClearSignature("witnessSignature")}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signButton}
              onPress={() => setActiveSignature("witnessSignature")}
            >
              <Text style={styles.signButtonText}>Add Witness Signature</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Paramedic Information *</Text>
          <TextInput
            style={[styles.input, { marginBottom: 12 }]}
            value={refusalInfo.paramedicName}
            onChangeText={(text) => updateRefusalInfo({ paramedicName: text })}
            placeholder="Paramedic name"
            placeholderTextColor="#999"
          />
          
          {refusalInfo.paramedicSignature ? (
            <View style={styles.signaturePreview}>
              <Text style={styles.signedText}>✓ Signed</Text>
              <TouchableOpacity
                onPress={() => handleClearSignature("paramedicSignature")}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signButton}
              onPress={() => setActiveSignature("paramedicSignature")}
            >
              <Text style={styles.signButtonText}>Add Paramedic Signature</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTab}>
          <Text style={styles.saveButtonText}>Save Refusal Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReport}>
          <Check size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
      </View>

      {activeSignature && (
        <SignatureModal
          visible={true}
          onClose={() => setActiveSignature(null)}
          onSave={(signature: string) => handleSaveSignature(activeSignature, signature)}
          title={
            activeSignature === "patientSignature"
              ? "Patient Signature"
              : activeSignature === "witnessSignature"
              ? "Witness Signature"
              : "Paramedic Signature"
          }
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 12,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 16,
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#991B1B",
    marginLeft: 12,
    lineHeight: 20,
  },
  section: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dateTimeButton: {
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  dateTimeButtonText: {
    color: "#0066CC",
    fontSize: 14,
    fontWeight: "500",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    marginRight: 12,
  },
  signatureSection: {
    marginBottom: 24,
  },
  signatureLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  signButton: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
  },
  signButtonText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "500",
  },
  signaturePreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  signedText: {
    color: "#16A34A",
    fontSize: 15,
    fontWeight: "500",
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    margin: 20,
    marginTop: 0,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#28A745",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#28A745",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0066CC",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0066CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
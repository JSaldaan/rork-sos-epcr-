import React, { useCallback, useMemo, useState } from "react";
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
import { Truck, MapPin, Users, FileText, ChevronDown, Check } from "lucide-react-native";
import { usePCRStore } from "@/store/pcrStore";

export default function TransportScreen() {
  const { transportInfo, updateTransportInfo, saveTransportData } = usePCRStore();
  const [showHospitalDropdown, setShowHospitalDropdown] = useState<boolean>(false);

  const handleSaveTransport = useCallback(async () => {
    if (!transportInfo.destination) {
      Alert.alert("Required", "Please select a destination hospital");
      return;
    }
    
    try {
      await saveTransportData();
      console.log('Transport information saved to draft');
      Alert.alert("Success", "Transport information saved successfully.");
    } catch (error) {
      console.error('Error saving transport data:', error);
      Alert.alert("Error", "Failed to save transport information");
    }
  }, [transportInfo.destination, saveTransportData]);

  const hospitals = useMemo(() => [
    "Hamad General Hospital",
    "Al Wakra Hospital", 
    "Al Khor Hospital",
    "Women's Wellness & Research Center",
    "Heart Hospital",
    "National Center for Cancer Care & Research",
    "Rumailah Hospital",
    "Al Amal Hospital",
  ], []);

  const transportModes = useMemo(() => [
    "Emergency (Code 3)",
    "Urgent (Code 2)", 
    "Non-Emergency (Code 1)",
    "Inter-facility Transfer",
  ], []);

  const handleHospitalSelect = useCallback((hospital: string) => {
    updateTransportInfo({ destination: hospital });
    setShowHospitalDropdown(false);
  }, [updateTransportInfo]);

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Destination Hospital</Text>
        </View>

        <Text style={styles.label}>Select Hospital</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowHospitalDropdown(true)}
        >
          <Text style={[
            styles.dropdownButtonText,
            !transportInfo.destination && styles.dropdownPlaceholder
          ]}>
            {transportInfo.destination || "Select destination hospital"}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Truck size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Transport Details</Text>
        </View>

        <Text style={styles.label}>Transport Mode</Text>
        {transportModes.map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeButton,
              transportInfo.mode === mode && styles.modeButtonActive,
            ]}
            onPress={() => updateTransportInfo({ mode })}
          >
            <Text
              style={[
                styles.modeText,
                transportInfo.mode === mode && styles.modeTextActive,
              ]}
            >
              {mode}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Ambulance Unit Number</Text>
        <TextInput
          style={styles.input}
          value={transportInfo.unitNumber}
          onChangeText={(text) => updateTransportInfo({ unitNumber: text })}
          placeholder="Enter unit number (e.g., A-101)"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Users size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Crew Information</Text>
        </View>

        <Text style={styles.label}>Primary Paramedic</Text>
        <TextInput
          style={styles.input}
          value={transportInfo.primaryParamedic}
          onChangeText={(text) => updateTransportInfo({ primaryParamedic: text })}
          placeholder="Enter paramedic name"
        />

        <Text style={styles.label}>Secondary Paramedic/EMT</Text>
        <TextInput
          style={styles.input}
          value={transportInfo.secondaryParamedic}
          onChangeText={(text) => updateTransportInfo({ secondaryParamedic: text })}
          placeholder="Enter second crew member name"
        />

        <Text style={styles.label}>Driver</Text>
        <TextInput
          style={styles.input}
          value={transportInfo.driver}
          onChangeText={(text) => updateTransportInfo({ driver: text })}
          placeholder="Enter driver name"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Additional Notes</Text>
        </View>

        <Text style={styles.label}>Transport Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={transportInfo.notes}
          onChangeText={(text) => updateTransportInfo({ notes: text })}
          placeholder="Any additional transport information, complications, or special circumstances"
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveTransport}>
        <Text style={styles.saveButtonText}>Save Transport Information</Text>
      </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showHospitalDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHospitalDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHospitalDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Hospital</Text>
            </View>
            <FlatList
              data={hospitals}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleHospitalSelect(item)}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                  {transportInfo.destination === item && (
                    <Check size={20} color="#0066CC" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  hospitalButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  hospitalButtonActive: {
    backgroundColor: "#0066CC",
    borderColor: "#0066CC",
  },
  hospitalText: {
    fontSize: 16,
    color: "#333",
  },
  hospitalTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  modeButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  modeButtonActive: {
    backgroundColor: "#0066CC",
    borderColor: "#0066CC",
  },
  modeText: {
    fontSize: 14,
    color: "#333",
  },
  modeTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#28A745",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 20,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});
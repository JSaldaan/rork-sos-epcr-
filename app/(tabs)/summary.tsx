import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { FileText, Send, User, Activity, Truck, Clock, UserCheck, ChevronDown, Users } from "lucide-react-native";
import { usePCRStore } from "@/store/pcrStore";
import SignatureModal from "@/components/SignatureModal";

export default function SummaryScreen() {
  const { patientInfo, incidentInfo, vitals, transportInfo, signatureInfo, updateSignatureInfo, saveCurrentPCRDraft, saveTabDataWithNotification, submitReportWithNotification, staffMembers, currentSession } = usePCRStore();
  const get = usePCRStore.getState;
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeSignature, setActiveSignature] = useState<string | null>(null);
  const [showStaffSelector, setShowStaffSelector] = useState<string | null>(null);

  const handleSaveSignature = (field: string, signature: string) => {
    console.log('💾 Saving signature for field:', field);
    console.log('🔒 Signature will persist during input changes');
    // Save both the signature and the paths for proper display and persistence
    if (field === 'nurseSignaturePaths') {
      updateSignatureInfo({ 
        nurseSignature: signatureInfo.nurseSignature || '', // Keep existing name - staff must input
        nurseSignaturePaths: signature 
      });
    } else if (field === 'doctorSignaturePaths') {
      updateSignatureInfo({ 
        doctorSignature: signatureInfo.doctorSignature || '', // Keep existing name - staff must input
        doctorSignaturePaths: signature 
      });
    } else if (field === 'othersSignaturePaths') {
      updateSignatureInfo({ 
        othersSignature: signatureInfo.othersSignature || '', // Keep existing name - staff must input
        othersSignaturePaths: signature 
      });
    } else {
      updateSignatureInfo({ [field]: signature });
    }
    setActiveSignature(null);
    console.log('✅ Signature saved and modal closed');
    console.log('👥 Staff must input practitioner name manually');
  };

  const handleClearSignature = (field: string) => {
    Alert.alert(
      "Clear Signature",
      "Are you sure you want to clear this signature? The practitioner name will be kept for staff to re-enter.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Signature Only",
          style: "destructive",
          onPress: () => {
            if (field === 'nurseSignaturePaths') {
              updateSignatureInfo({ nurseSignaturePaths: "" }); // Keep name, clear signature
            } else if (field === 'doctorSignaturePaths') {
              updateSignatureInfo({ doctorSignaturePaths: "" }); // Keep name, clear signature
            } else if (field === 'othersSignaturePaths') {
              updateSignatureInfo({ othersSignaturePaths: "" }); // Keep name, clear signature
            } else {
              updateSignatureInfo({ [field]: "" });
            }
            console.log('🗑️ Signature cleared for field:', field);
            console.log('👥 Practitioner name preserved for staff input');
          },
        },
      ]
    );
  };

  const handleSavePCR = useCallback(async () => {
    if (!patientInfo.firstName || !patientInfo.lastName) {
      Alert.alert("Incomplete", "Please complete patient information before saving");
      return;
    }
    
    Alert.alert(
      "Save for Preview",
      "This will save your current progress for preview. To submit the report to admin, use the Submit button in the Preview tab.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Save for Preview", 
          style: "default",
          onPress: async () => {
            try {
              console.log('Saving PCR data for preview...');
              await get().saveCurrentPCRDraft();
              console.log('PCR data saved to draft successfully');
              Alert.alert("Success", "PCR data saved for preview! Go to Preview tab to review and submit.");
            } catch (error) {
              console.error('Error saving PCR data:', error);
              Alert.alert("Error", "Failed to save PCR data. Please try again.");
            }
          }
        },
      ]
    );
  }, [patientInfo.firstName, patientInfo.lastName]);

  const status = useMemo(() => {
    let completed = 0;
    const total = 5;

    if (patientInfo.firstName && patientInfo.lastName) completed++;
    if (incidentInfo.chiefComplaint) completed++;
    if (vitals.length > 0) completed++;
    if (transportInfo.destination) completed++;
    if ((signatureInfo.nurseSignature || signatureInfo.nurseSignaturePaths) || 
        (signatureInfo.doctorSignature || signatureInfo.doctorSignaturePaths) ||
        (signatureInfo.othersSignature || signatureInfo.othersSignaturePaths)) completed++;

    return { completed, total, percentage: Math.round((completed / total) * 100) };
  }, [
    patientInfo.firstName, 
    patientInfo.lastName, 
    incidentInfo.chiefComplaint, 
    vitals.length, 
    transportInfo.destination, 
    signatureInfo.nurseSignature, 
    signatureInfo.nurseSignaturePaths, 
    signatureInfo.doctorSignature, 
    signatureInfo.doctorSignaturePaths,
    signatureInfo.othersSignature,
    signatureInfo.othersSignaturePaths
  ]);

  const handleSaveTab = useCallback(async () => {
    try {
      await saveTabDataWithNotification('Summary');
      Alert.alert("Success", "Summary data saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save summary data. Please try again.");
    }
  }, [saveTabDataWithNotification]);

  const handleSubmitReport = useCallback(async () => {
    if (status.percentage < 75) {
      Alert.alert("Incomplete Report", "Please complete at least 75% of the form before submitting.");
      return;
    }
    
    Alert.alert(
      "Submit Complete Report",
      "Are you sure you want to submit this complete PCR report? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Report",
          style: "default",
          onPress: async () => {
            try {
              await submitReportWithNotification();
              Alert.alert(
                "Report Submitted Successfully!",
                "Your complete PCR report has been submitted to the admin system. You can view it in the Preview tab."
              );
            } catch (error) {
              Alert.alert("Error", "Failed to submit report. Please try again.");
            }
          }
        }
      ]
    );
  }, [status.percentage, submitReportWithNotification]);

  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);
  
  const handleStaffSelection = (staffMember: any, field: string) => {
    console.log('👤 Staff selected:', staffMember.name, 'for field:', field);
    if (field === 'nurse') {
      updateSignatureInfo({ 
        nurseSignature: staffMember.name,
        nurseCorporationId: staffMember.corporationId 
      });
    } else if (field === 'doctor') {
      updateSignatureInfo({ 
        doctorSignature: staffMember.name,
        doctorCorporationId: staffMember.corporationId 
      });
    }
    setShowStaffSelector(null);
  };
  
  const getFilteredStaffMembers = (role: string) => {
    return staffMembers.filter(staff => 
      staff.isActive && 
      (role === 'nurse' ? 
        (staff.role.toLowerCase().includes('nurse') || staff.role.toLowerCase().includes('rn')) :
        (staff.role.toLowerCase().includes('doctor') || staff.role.toLowerCase().includes('dr') || staff.role.toLowerCase().includes('physician'))
      )
    );
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <FileText size={24} color="#0066CC" />
          <Text style={styles.statusTitle}>PCR Completion Status</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${status.percentage}%` }]} />
        </View>
        <Text style={styles.statusText}>
          {status.completed} of {status.total} sections completed ({status.percentage}%)
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={[styles.statusBadge, patientInfo.firstName ? styles.completeBadge : styles.incompleteBadge]}>
            <Text style={styles.statusBadgeText}>
              {patientInfo.firstName ? "Complete" : "Incomplete"}
            </Text>
          </View>
        </View>
        
        {patientInfo.firstName ? (
          <View>
            <Text style={styles.summaryText}>
              <Text style={styles.label}>Name: </Text>
              {patientInfo.firstName} {patientInfo.lastName}
            </Text>
            {patientInfo.age && (
              <Text style={styles.summaryText}>
                <Text style={styles.label}>Age: </Text>
                {patientInfo.age}
              </Text>
            )}
            {patientInfo.gender && (
              <Text style={styles.summaryText}>
                <Text style={styles.label}>Gender: </Text>
                {patientInfo.gender}
              </Text>
            )}
            {patientInfo.phone && (
              <Text style={styles.summaryText}>
                <Text style={styles.label}>Phone: </Text>
                {patientInfo.phone}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.incompleteText}>Patient information not completed</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Incident Information</Text>
          <View style={[styles.statusBadge, incidentInfo.chiefComplaint ? styles.completeBadge : styles.incompleteBadge]}>
            <Text style={styles.statusBadgeText}>
              {incidentInfo.chiefComplaint ? "Complete" : "Incomplete"}
            </Text>
          </View>
        </View>
        
        {incidentInfo.chiefComplaint ? (
          <View>
            {incidentInfo.location && (
              <Text style={styles.summaryText}>
                <Text style={styles.label}>Location: </Text>
                {incidentInfo.location}
              </Text>
            )}
            <Text style={styles.summaryText}>
              <Text style={styles.label}>Chief Complaint: </Text>
              {incidentInfo.chiefComplaint}
            </Text>
            {incidentInfo.priority && (
              <Text style={styles.summaryText}>
                <Text style={styles.label}>Priority: </Text>
                {incidentInfo.priority}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.incompleteText}>Incident information not completed</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Activity size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Vital Signs</Text>
          <View style={[styles.statusBadge, vitals.length > 0 ? styles.completeBadge : styles.incompleteBadge]}>
            <Text style={styles.statusBadgeText}>
              {vitals.length > 0 ? `${vitals.length} Records` : "No Records"}
            </Text>
          </View>
        </View>
        
        {vitals.length > 0 ? (
          <View>
            {vitals.map((vital, index) => (
              <View key={index} style={styles.vitalSummary}>
                <View style={styles.vitalTimeContainer}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.vitalTime}>{formatTime(vital.timestamp)}</Text>
                </View>
                <View style={styles.vitalValues}>
                  {vital.bloodPressureSystolic && vital.bloodPressureDiastolic && (
                    <Text style={styles.vitalValue}>
                      BP: {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                    </Text>
                  )}
                  {vital.heartRate && (
                    <Text style={styles.vitalValue}>HR: {vital.heartRate}</Text>
                  )}
                  {vital.oxygenSaturation && (
                    <Text style={styles.vitalValue}>SpO2: {vital.oxygenSaturation}%</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.incompleteText}>No vital signs recorded</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Truck size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Transport Information</Text>
          <View style={[styles.statusBadge, transportInfo.destination ? styles.completeBadge : styles.incompleteBadge]}>
            <Text style={styles.statusBadgeText}>
              {transportInfo.destination ? "Complete" : "Incomplete"}
            </Text>
          </View>
        </View>
        
        {transportInfo.destination ? (
          <View>
            <Text style={styles.summaryText}>
              <Text style={styles.label}>Destination: </Text>
              {transportInfo.destination}
            </Text>
            {transportInfo.mode && (
              <Text style={styles.summaryText}>
                <Text style={styles.label}>Transport Mode: </Text>
                {transportInfo.mode}
              </Text>
            )}
            {transportInfo.unitNumber && (
              <Text style={styles.summaryText}>
                <Text style={styles.label}>Unit: </Text>
                {transportInfo.unitNumber}
              </Text>
            )}
            {transportInfo.primaryParamedic && (
              <Text style={styles.summaryText}>
                <Text style={styles.label}>Primary Paramedic: </Text>
                {transportInfo.primaryParamedic}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.incompleteText}>Transport information not completed</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <UserCheck size={20} color="#0066CC" />
          <Text style={styles.sectionTitle}>Receiving Staff Signatures</Text>
          <View style={[styles.statusBadge, ((signatureInfo.nurseSignature || signatureInfo.nurseSignaturePaths) || 
                                                (signatureInfo.doctorSignature || signatureInfo.doctorSignaturePaths) ||
                                                (signatureInfo.othersSignature || signatureInfo.othersSignaturePaths)) ? styles.completeBadge : styles.incompleteBadge]}>
            <Text style={styles.statusBadgeText}>
              {((signatureInfo.nurseSignature || signatureInfo.nurseSignaturePaths) || 
                (signatureInfo.doctorSignature || signatureInfo.doctorSignaturePaths) ||
                (signatureInfo.othersSignature || signatureInfo.othersSignaturePaths)) ? "Has Signatures" : "No Signatures"}
            </Text>
          </View>
        </View>
        
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Nurse Signature</Text>
          {signatureInfo.nurseSignaturePaths ? (
            <View style={styles.signaturePreview}>
              <Text style={styles.signedText}>✓ Signature Captured</Text>
              <TouchableOpacity
                onPress={() => handleClearSignature("nurseSignaturePaths")}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signButton}
              onPress={() => setActiveSignature("nurseSignaturePaths")}
            >
              <Text style={styles.signButtonText}>Add Signature</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.staffInputSection}>
            <Text style={styles.label}>Nurse Information</Text>
            <View style={styles.staffInputRow}>
              <View style={styles.staffInputContainer}>
                <Text style={styles.subLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={signatureInfo.nurseSignature}
                  onChangeText={(text) => updateSignatureInfo({ nurseSignature: text })}
                  placeholder="Enter receiving nurse full name"
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity 
                style={styles.staffSelectorButton}
                onPress={() => setShowStaffSelector('nurse')}
              >
                <Users size={16} color="#0066CC" />
                <Text style={styles.staffSelectorText}>Select</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.subLabel}>Corporation ID</Text>
            <TextInput
              style={styles.input}
              value={signatureInfo.nurseCorporationId}
              onChangeText={(text) => updateSignatureInfo({ nurseCorporationId: text })}
              placeholder="Enter nurse corporation ID"
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Doctor Signature</Text>
          {signatureInfo.doctorSignaturePaths ? (
            <View style={styles.signaturePreview}>
              <Text style={styles.signedText}>✓ Signature Captured</Text>
              <TouchableOpacity
                onPress={() => handleClearSignature("doctorSignaturePaths")}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signButton}
              onPress={() => setActiveSignature("doctorSignaturePaths")}
            >
              <Text style={styles.signButtonText}>Add Signature</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.staffInputSection}>
            <Text style={styles.label}>Doctor Information</Text>
            <View style={styles.staffInputRow}>
              <View style={styles.staffInputContainer}>
                <Text style={styles.subLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={signatureInfo.doctorSignature}
                  onChangeText={(text) => updateSignatureInfo({ doctorSignature: text })}
                  placeholder="Enter receiving doctor full name"
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity 
                style={styles.staffSelectorButton}
                onPress={() => setShowStaffSelector('doctor')}
              >
                <Users size={16} color="#0066CC" />
                <Text style={styles.staffSelectorText}>Select</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.subLabel}>Corporation ID</Text>
            <TextInput
              style={styles.input}
              value={signatureInfo.doctorCorporationId}
              onChangeText={(text) => updateSignatureInfo({ doctorCorporationId: text })}
              placeholder="Enter doctor corporation ID"
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Others Signature</Text>
          {signatureInfo.othersSignaturePaths ? (
            <View style={styles.signaturePreview}>
              <Text style={styles.signedText}>✓ Signature Captured</Text>
              <TouchableOpacity
                onPress={() => handleClearSignature("othersSignaturePaths")}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signButton}
              onPress={() => setActiveSignature("othersSignaturePaths")}
            >
              <Text style={styles.signButtonText}>Add Signature</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={signatureInfo.othersSignature}
            onChangeText={(text) => updateSignatureInfo({ othersSignature: text })}
            placeholder="Enter full name"
            placeholderTextColor="#999"
          />
          
          <Text style={styles.label}>Role/Title</Text>
          <TextInput
            style={styles.input}
            value={signatureInfo.othersRole}
            onChangeText={(text) => updateSignatureInfo({ othersRole: text })}
            placeholder="Enter role or title (e.g., Family Member, Witness)"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTab}>
          <Text style={styles.saveButtonText}>Save Summary Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, status.percentage < 75 && styles.submitButtonDisabled]} 
          onPress={handleSubmitReport}
          disabled={status.percentage < 75}
        >
          <Send size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Submit Complete Report</Text>
        </TouchableOpacity>
      </View>

      {status.percentage < 75 && (
        <Text style={styles.warningText}>
          Complete at least 75% of the form to submit the complete report
        </Text>
      )}

      <View style={styles.bottomPadding} />

      {activeSignature && (
        <SignatureModal
          visible={true}
          onClose={() => {
            console.log('❌ Signature modal closed without saving');
            setActiveSignature(null);
          }}
          onSave={(signature: string) => handleSaveSignature(activeSignature, signature)}
          title={
            activeSignature === "nurseSignaturePaths"
              ? "Nurse Signature"
              : activeSignature === "doctorSignaturePaths"
              ? "Doctor Signature"
              : "Others Signature"
          }
          initialSignature={
            activeSignature === "nurseSignaturePaths" ? signatureInfo.nurseSignaturePaths :
            activeSignature === "doctorSignaturePaths" ? signatureInfo.doctorSignaturePaths :
            signatureInfo.othersSignaturePaths
          }
        />
      )}
      
      {/* Staff Selector Modal */}
      <Modal
        visible={!!showStaffSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStaffSelector(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.staffModal}>
            <View style={styles.staffModalHeader}>
              <Text style={styles.staffModalTitle}>
                Select {showStaffSelector === 'nurse' ? 'Nurse' : 'Doctor'}
              </Text>
              <TouchableOpacity onPress={() => setShowStaffSelector(null)}>
                <Text style={styles.staffModalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getFilteredStaffMembers(showStaffSelector || '')}
              keyExtractor={(item) => item.corporationId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.staffItem}
                  onPress={() => handleStaffSelection(item, showStaffSelector || '')}
                >
                  <View>
                    <Text style={styles.staffName}>{item.name}</Text>
                    <Text style={styles.staffDetails}>
                      {item.corporationId} • {item.role} • {item.department}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyStaffList}>
                  <Text style={styles.emptyStaffText}>
                    No {showStaffSelector} staff members found.
                    You can still enter the information manually.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  statusCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#0066CC",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#28A745",
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeBadge: {
    backgroundColor: "#28A745",
  },
  incompleteBadge: {
    backgroundColor: "#DC3545",
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  incompleteText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  vitalSummary: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  vitalTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  vitalTime: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  vitalValues: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  vitalValue: {
    fontSize: 14,
    color: "#333",
    marginRight: 16,
    marginBottom: 4,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#CCC",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  warningText: {
    textAlign: "center",
    color: "#DC3545",
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  bottomPadding: {
    height: 20,
  },
  signatureSection: {
    marginBottom: 20,
  },
  signatureSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
    marginTop: 8,
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
    marginBottom: 16,
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
    marginBottom: 16,
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
  staffInputSection: {
    marginTop: 8,
  },
  staffInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 8,
  },
  staffInputContainer: {
    flex: 1,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    marginBottom: 4,
  },
  staffSelectorButton: {
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#B3D9FF",
    marginBottom: 16,
  },
  staffSelectorText: {
    color: "#0066CC",
    fontSize: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  staffModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  staffModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  staffModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  staffModalClose: {
    color: "#0066CC",
    fontSize: 16,
    fontWeight: "500",
  },
  staffItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  staffName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  staffDetails: {
    fontSize: 14,
    color: "#666",
  },
  emptyStaffList: {
    padding: 20,
    alignItems: "center",
  },
  emptyStaffText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { usePCRStore } from "@/store/pcrStore";
import { Send, FileText, AlertCircle } from "lucide-react-native";
import { TEAMS_CONFIG, sendToTeams as sendToTeamsAPI, testLogicAppConnection, testMinimalConnection } from "@/constants/teamsConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PreviewScreen() {
  const {
    patientInfo,
    callTimeInfo,
    incidentInfo,
    vitals,
    transportInfo,
    signatureInfo,
    refusalInfo,
    resetPCR,
    submitPCR,
  } = usePCRStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastSubmissionResult, setLastSubmissionResult] = useState<any>(null);

  const sendToTeams = async (reportData: any) => {
    // Format the data for Teams
    const formattedData = {
      patientInfo: {
        name: `${patientInfo.firstName} ${patientInfo.lastName}`.trim(),
        age: patientInfo.age,
        gender: patientInfo.gender,
        mrn: patientInfo.mrn,
      },
      chiefComplaint: incidentInfo.chiefComplaint,
      notes: incidentInfo.assessment,
      vitals: vitals.map(v => ({
        bloodPressure: v.bloodPressureSystolic && v.bloodPressureDiastolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : undefined,
        pulse: v.heartRate || undefined,
        respiratoryRate: v.respiratoryRate || undefined,
        oxygenSaturation: v.oxygenSaturation || undefined,
        temperature: v.temperature || undefined,
        bloodGlucose: v.bloodGlucose || undefined,
        timestamp: v.timestamp,
      })),
      transport: {
        pickupLocation: incidentInfo.location,
        destination: transportInfo.destination,
        priority: incidentInfo.priority,
        transportMode: transportInfo.mode,
      },
      refusal: refusalInfo.patientName ? {
        reason: refusalInfo.reasonForRefusal,
        witnessName: refusalInfo.witnessName,
        hasSignature: !!refusalInfo.patientSignature,
      } : undefined,
    };

    const result = await sendToTeamsAPI(formattedData);
    
    // Return the result directly with all its properties
    return result;
  };



  const handleSubmit = async () => {
    Alert.alert(
      "Submit Report",
      "Are you sure you want to submit this report? This will save it to My Reports, Admin Panel, and send the data to Microsoft Teams.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit",
          onPress: async () => {
            setIsSubmitting(true);
            
            const reportData = {
              patientInfo,
              callTimeInfo,
              incidentInfo,
              vitals,
              transportInfo,
              signatureInfo,
              refusalInfo,
              submittedAt: new Date().toISOString(),
            };

            console.log("Submitting PCR Report:", reportData);

            try {
              // Submit to admin panel and My Reports (save to local storage)
              console.log('=== STARTING PCR SUBMISSION ===');
              console.log('Submitting PCR with data:', {
                patient: `${patientInfo.firstName} ${patientInfo.lastName}`,
                vitals: vitals.length,
                transport: transportInfo.destination,
                signatures: {
                  nurse: !!signatureInfo.nurseSignaturePaths,
                  doctor: !!signatureInfo.doctorSignaturePaths,
                  others: !!signatureInfo.othersSignaturePaths
                },
                ecgCaptures: vitals.filter(v => v.ecgCapture).length
              });
              
              // Submit PCR - this will save to both My Reports and Admin Panel
              await submitPCR();
              console.log('PCR submitted successfully - available in My Reports and Admin Panel');
              console.log('Report includes all data from all tabs with unrestricted access for admin');
              console.log('=== PCR SUBMISSION COMPLETE ===');
              
              // Clear the draft since we're submitting
              try {
                await AsyncStorage.removeItem('currentPCRDraft');
                console.log('PCR draft cleared after submission');
              } catch (error) {
                console.error('Error clearing draft:', error);
              }
              
              // Send to Teams
              const teamsResult = await sendToTeams(reportData);
              setLastSubmissionResult(teamsResult);

              setIsSubmitting(false);

              if (teamsResult.success) {
                Alert.alert(
                  "✅ Report Submitted Successfully!",
                  `Your Patient Care Report has been submitted and is now available:\n\n📋 My Reports - View and copy your report\n🏥 Admin Panel - Full access for printing to PDF/Word\n📧 Microsoft Teams - Data sent successfully\n\n🖨️ All signatures and ECG captures can be printed without restrictions\n\nResponse: ${teamsResult.details?.status || 'OK'}`,
                  [
                    {
                      text: "View My Reports",
                      onPress: async () => {
                        await resetPCR();
                        // Navigate to My Reports tab
                      },
                    },
                    {
                      text: "New Report",
                      onPress: async () => {
                        await resetPCR();
                      },
                    },
                  ]
                );
              } else {
                // Show detailed error information
                const errorDetails = teamsResult.details ? 
                  `\n\nDetails:\nStatus: ${teamsResult.details.status || 'N/A'}\nResponse: ${teamsResult.details.response || teamsResult.details.error || 'No response'}` : '';
                
                console.error('\n=== TEAMS SUBMISSION FAILED ===');
                console.error('Error:', teamsResult.error);
                console.error('Details:', JSON.stringify(teamsResult.details, null, 2));
                console.error('Report Data:', JSON.stringify(reportData, null, 2));
                console.error('========================\n');
                
                Alert.alert(
                  "⚠️ Partial Success",
                  `✅ PCR saved to My Reports and Admin Panel\n❌ Teams submission failed\n\n${teamsResult.error || 'Failed to send to Teams'}${errorDetails}\n\n📋 Your report is safely stored and accessible in:\n• My Reports tab (copy/print)\n• Admin Panel (unrestricted PDF/Word export)\n\n🖨️ All signatures and ECG captures are preserved for admin printing`,
                  [
                    {
                      text: "View My Reports",
                      onPress: async () => {
                        await resetPCR();
                      },
                    },
                    {
                      text: "New Report",
                      onPress: async () => {
                        await resetPCR();
                      },
                    },
                  ]
                );
              }
            } catch (localError) {
              setIsSubmitting(false);
              console.error('PCR submission error:', localError);
              Alert.alert(
                "❌ Submission Error",
                "Failed to submit PCR. Please check your data and try again.\n\nAll your work is saved as a draft and will be restored when you return.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  const renderSection = (title: string, content: React.ReactNode) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>
          {React.isValidElement(content) ? content : <Text>{String(content)}</Text>}
        </View>
      </View>
    );
  };

  const renderField = (label: string, value: string | undefined) => {
    if (!value || value === "" || value === "undefined") return null;
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}:</Text>
        <Text style={styles.fieldValue}>{String(value)}</Text>
      </View>
    );
  };

  const hasRefusalData = refusalInfo.patientName || refusalInfo.reasonForRefusal;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <FileText size={32} color="#0066CC" />
          <Text style={styles.headerTitle}>Patient Care Report Preview</Text>
          <Text style={styles.headerSubtitle}>Review all information before submitting</Text>
          {!TEAMS_CONFIG.enabled && (
            <View style={styles.warningBanner}>
              <AlertCircle size={16} color="#FF9800" />
              <Text style={[styles.warningText, { marginLeft: 5 }]}>
                Teams integration disabled - Follow setup instructions in constants/teamsConfig.ts
              </Text>
            </View>
          )}
          {lastSubmissionResult && (
            <View style={[styles.warningBanner, lastSubmissionResult.success ? styles.successBanner : styles.errorBanner]}>
              <AlertCircle size={16} color={lastSubmissionResult.success ? "#4CAF50" : "#F44336"} />
              <Text style={[styles.warningText, { color: lastSubmissionResult.success ? "#2E7D32" : "#C62828", marginLeft: 5 }]}>
                Last submission: {lastSubmissionResult.success ? 'Success' : 'Failed'} - {lastSubmissionResult.details?.status || 'No status'}
              </Text>
            </View>
          )}
        </View>

        {renderSection(
          "Patient Information",
          <View>
            {renderField("Name", `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim() || undefined)}
            {renderField("Age", patientInfo.age)}
            {renderField("Gender", patientInfo.gender)}
            {renderField("Phone", patientInfo.phone)}
            {renderField("MRN", patientInfo.mrn)}
          </View>
        )}

        {renderSection(
          "Call Time Information",
          <View>
            {renderField("Date", callTimeInfo.date)}
            {renderField("Time of Call", callTimeInfo.timeOfCall)}
            {renderField("Arrival on Scene", callTimeInfo.arrivalOnScene)}
            {renderField("At Patient Side", callTimeInfo.atPatientSide)}
            {renderField("To Destination", callTimeInfo.toDestination)}
            {renderField("At Destination", callTimeInfo.atDestination)}
          </View>
        )}

        {renderSection(
          "Incident Information",
          <View>
            {renderField("Location", incidentInfo.location)}
            {renderField("On Arrival Info", incidentInfo.onArrivalInfo)}
            {renderField("Chief Complaint", incidentInfo.chiefComplaint)}
            {renderField("History", incidentInfo.history)}
            {renderField("Assessment", incidentInfo.assessment)}
            {renderField("Treatment Given", incidentInfo.treatmentGiven)}
            {renderField("Priority", incidentInfo.priority)}
            {renderField("Provisional Diagnosis", incidentInfo.provisionalDiagnosis)}
            {renderField("Additional Notes", incidentInfo.additionalNotes)}
          </View>
        )}

        {vitals.length > 0 && renderSection(
          "Vital Signs",
          <View>
            {vitals.map((vital, index) => (
              <View key={index} style={styles.vitalSet}>
                <Text style={styles.vitalSetTitle}>Set {index + 1} - {vital.timestamp ? new Date(vital.timestamp).toLocaleString() : 'No timestamp'}</Text>
                {renderField("Blood Pressure", vital.bloodPressureSystolic && vital.bloodPressureDiastolic ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg` : undefined)}
                {renderField("Heart Rate", vital.heartRate ? `${vital.heartRate} bpm` : undefined)}
                {renderField("Respiratory Rate", vital.respiratoryRate ? `${vital.respiratoryRate} /min` : undefined)}
                {renderField("O2 Saturation", vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : undefined)}
                {renderField("Temperature", vital.temperature ? `${vital.temperature}°C` : undefined)}
                {renderField("Blood Glucose", vital.bloodGlucose ? `${vital.bloodGlucose} mg/dL` : undefined)}
                {renderField("Pain Scale", vital.painScale ? `${vital.painScale}/10` : undefined)}
                {vital.ecgCapture && (
                  <View style={styles.ecgCaptureField}>
                    <Text style={styles.fieldLabel}>ECG Photo:</Text>
                    {vital.ecgCapture.startsWith('data:image') ? (
                      <View>
                        <Image 
                          source={{ uri: vital.ecgCapture }}
                          style={styles.ecgImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.ecgCaptureTime}>
                          Captured: {vital.ecgCaptureTimestamp ? new Date(vital.ecgCaptureTimestamp).toLocaleString() : 'N/A'}
                        </Text>
                        <Text style={styles.ecgPhotoInfo}>✓ ECG photo ready for printing</Text>
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.ecgCapturePresent}>📷 ECG Captured</Text>
                        <Text style={styles.ecgCaptureTime}>
                          {vital.ecgCaptureTimestamp ? new Date(vital.ecgCaptureTimestamp).toLocaleString() : 'N/A'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {renderSection(
          "Transport Information",
          <View>
            {renderField("Destination", transportInfo.destination === "Other" && transportInfo.customDestination ? transportInfo.customDestination : transportInfo.destination)}
            {renderField("Mode", transportInfo.mode)}
            {renderField("Unit Number", transportInfo.unitNumber)}
            {renderField("Departure Time", transportInfo.departureTime)}
            {renderField("Arrival Time", transportInfo.arrivalTime)}
            {renderField("Mileage", transportInfo.mileage)}
            {renderField("Primary Paramedic", transportInfo.primaryParamedic)}
            {renderField("Secondary Paramedic", transportInfo.secondaryParamedic)}
            {renderField("Driver", transportInfo.driver)}
            {renderField("Notes", transportInfo.notes)}
          </View>
        )}

        {hasRefusalData && renderSection(
          "Patient Refusal Form",
          <View>
            <View style={styles.refusalHeader}>
              <Text style={styles.refusalTitle}>TREATMENT REFUSAL DOCUMENTATION</Text>
              <Text style={styles.refusalSubtitle}>This form documents the patient&apos;s refusal of medical treatment or transport</Text>
            </View>
            {renderField("Patient Name", refusalInfo.patientName)}
            {renderField("Date of Refusal", refusalInfo.dateOfRefusal)}
            {renderField("Time of Refusal", refusalInfo.timeOfRefusal)}
            {renderField("Reason for Refusal", refusalInfo.reasonForRefusal)}
            {renderField("Risks Explained to Patient", refusalInfo.risksExplained ? "Yes" : "No")}
            {renderField("Patient Has Mental Capacity", refusalInfo.mentalCapacity ? "Yes" : "No")}
            {renderField("Witness Name", refusalInfo.witnessName)}
            {renderField("Paramedic Name", refusalInfo.paramedicName)}
            {renderField("Additional Notes", refusalInfo.additionalNotes)}
            
            <View style={styles.signatureSection}>
              <Text style={styles.signatureSectionTitle}>SIGNATURES</Text>
              {refusalInfo.patientSignature && (
                <View style={styles.signatureField}>
                  <Text style={styles.fieldLabel}>Patient Signature:</Text>
                  <Text style={styles.signaturePresent}>✓ Signature captured and verified</Text>
                  <Text style={styles.signatureNote}>Patient acknowledges refusal of treatment</Text>
                </View>
              )}
              {refusalInfo.witnessSignature && (
                <View style={styles.signatureField}>
                  <Text style={styles.fieldLabel}>Witness Signature:</Text>
                  <Text style={styles.signaturePresent}>✓ Signature captured and verified</Text>
                  <Text style={styles.signatureNote}>Witness: {refusalInfo.witnessName}</Text>
                </View>
              )}
              {refusalInfo.paramedicSignature && (
                <View style={styles.signatureField}>
                  <Text style={styles.fieldLabel}>Paramedic Signature:</Text>
                  <Text style={styles.signaturePresent}>✓ Signature captured and verified</Text>
                  <Text style={styles.signatureNote}>Paramedic: {refusalInfo.paramedicName}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {renderSection(
          "Healthcare Provider Signatures",
          <View>
            <View style={styles.signatureSection}>
              <Text style={styles.signatureSectionTitle}>AUTHORIZED SIGNATURES</Text>
              {signatureInfo.nurseSignature && (
                <View style={styles.signatureField}>
                  <Text style={styles.fieldLabel}>Nurse Signature:</Text>
                  <Text style={styles.signaturePresent}>✓ Signature captured and verified</Text>
                  {renderField("Nurse Name", signatureInfo.nurseSignature)}
                  {renderField("Corporation ID", signatureInfo.nurseCorporationId)}
                </View>
              )}
              {signatureInfo.doctorSignature && (
                <View style={styles.signatureField}>
                  <Text style={styles.fieldLabel}>Doctor Signature:</Text>
                  <Text style={styles.signaturePresent}>✓ Signature captured and verified</Text>
                  {renderField("Doctor Name", signatureInfo.doctorSignature)}
                  {renderField("Corporation ID", signatureInfo.doctorCorporationId)}
                </View>
              )}
              {signatureInfo.othersSignature && (
                <View style={styles.signatureField}>
                  <Text style={styles.fieldLabel}>Other Authorized Signature:</Text>
                  <Text style={styles.signaturePresent}>✓ Signature captured and verified</Text>
                  {renderField("Name", signatureInfo.othersSignature)}
                  {renderField("Role/Title", signatureInfo.othersRole)}
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.submitContainer}>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Submitting Report...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Send size={20} color="#fff" />
              <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Submit to My Reports & Admin</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#333",
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#0066CC",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 8,
  },
  sectionContent: {
    paddingTop: 5,
  },
  field: {
    flexDirection: "row",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#666",
    marginRight: 8,
    minWidth: 120,
  },
  fieldValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  vitalSet: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  vitalSetTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#0066CC",
    marginBottom: 10,
  },
  signatureField: {
    marginBottom: 10,
  },
  signaturePresent: {
    fontSize: 14,
    color: "#4CAF50",
    fontStyle: "italic" as const,
    marginTop: 5,
  },
  submitContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: "#0066CC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  bottomSpace: {
    height: 20,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 8,
    borderRadius: 5,
    marginTop: 10,
  },
  warningText: {
    fontSize: 12,
    color: "#E65100",
    flex: 1,
  },
  successBanner: {
    backgroundColor: "#E8F5E8",
  },
  errorBanner: {
    backgroundColor: "#FFEBEE",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  ecgCaptureField: {
    marginBottom: 10,
  },
  ecgCapturePresent: {
    fontSize: 14,
    color: "#4CAF50",
    fontStyle: "italic" as const,
    marginTop: 5,
  },
  ecgCaptureTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  ecgReference: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
    fontFamily: "monospace",
  },
  ecgImage: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  ecgPhotoInfo: {
    color: "#28A745",
    fontSize: 12,
    fontWeight: "500" as const,
    marginTop: 5,
  },
  refusalHeader: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  refusalTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#991B1B",
    marginBottom: 4,
  },
  refusalSubtitle: {
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 16,
  },
  signatureSection: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#16A34A",
  },
  signatureSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#15803D",
    marginBottom: 10,
  },
  signatureNote: {
    fontSize: 12,
    color: "#16A34A",
    marginTop: 2,
    fontStyle: "italic" as const,
  },

});
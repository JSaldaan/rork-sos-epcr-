import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
      "Are you sure you want to submit this report? This will save it to the Admin Panel and send the data to Microsoft Teams.",
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
              // Submit to admin panel (save to local storage)
              console.log('=== STARTING PCR SUBMISSION ===');
              console.log('Submitting PCR with data:', {
                patient: `${patientInfo.firstName} ${patientInfo.lastName}`,
                vitals: vitals.length,
                transport: transportInfo.destination,
                signatures: {
                  nurse: !!signatureInfo.nurseSignaturePaths,
                  doctor: !!signatureInfo.doctorSignaturePaths,
                  others: !!signatureInfo.othersSignaturePaths
                }
              });
              
              await submitPCR();
              console.log('PCR submitted to admin panel successfully');
              console.log('PCR should now be available in My Files and Admin Panel');
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
                  "Success",
                  `Report submitted successfully!\n\nSubmitted to Admin Panel and sent to Teams.\n\nLogic App Response: ${teamsResult.details?.status || 'OK'}\n\nYou can now view your submitted report in the "My Reports" tab.`,
                  [
                    {
                      text: "OK",
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
                
                console.error('\n=== SUBMISSION FAILED ===');
                console.error('Error:', teamsResult.error);
                console.error('Details:', JSON.stringify(teamsResult.details, null, 2));
                console.error('Report Data:', JSON.stringify(reportData, null, 2));
                console.error('========================\n');
                
                Alert.alert(
                  "Teams Submission Error",
                  `PCR submitted to Admin Panel but failed to send to Teams.\n\n${teamsResult.error || 'Failed to send to Teams'}${errorDetails}\n\nThe report is saved in Admin Panel and can be accessed in the "My Reports" tab.\n\nWould you like to continue?`,
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Continue",
                      onPress: async () => {
                        await resetPCR();
                      },
                    },
                  ]
                );
              }
            } catch (localError) {
              setIsSubmitting(false);
              console.error('Admin submission error:', localError);
              Alert.alert(
                "Submission Error",
                "Failed to submit PCR to Admin Panel. Please try again.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  const renderSection = (title: string, content: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{content}</View>
    </View>
  );

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
            {renderField("Chief Complaint", incidentInfo.chiefComplaint)}
            {renderField("History", incidentInfo.history)}
            {renderField("Assessment", incidentInfo.assessment)}
            {renderField("Treatment Given", incidentInfo.treatmentGiven)}
            {renderField("Priority", incidentInfo.priority)}
            {renderField("On Arrival Info", incidentInfo.onArrivalInfo)}
            {renderField("Provisional Diagnosis", incidentInfo.provisionalDiagnosis)}
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
                    <Text style={styles.fieldLabel}>ECG Capture:</Text>
                    <Text style={styles.ecgCapturePresent}>📈 ECG Recorded</Text>
                    <Text style={styles.ecgCaptureTime}>
                      {vital.ecgCaptureTimestamp ? new Date(vital.ecgCaptureTimestamp).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {renderSection(
          "Transport Information",
          <View>
            {renderField("Destination", transportInfo.destination)}
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
          "Patient Refusal",
          <View>
            {renderField("Patient Name", refusalInfo.patientName)}
            {renderField("Date of Refusal", refusalInfo.dateOfRefusal)}
            {renderField("Time of Refusal", refusalInfo.timeOfRefusal)}
            {renderField("Reason for Refusal", refusalInfo.reasonForRefusal)}
            {renderField("Risks Explained", refusalInfo.risksExplained ? "Yes" : "No")}
            {renderField("Mental Capacity Confirmed", refusalInfo.mentalCapacity ? "Yes" : "No")}
            {renderField("Witness Name", refusalInfo.witnessName)}
            {renderField("Paramedic Name", refusalInfo.paramedicName)}
            {renderField("Additional Notes", refusalInfo.additionalNotes)}
            {refusalInfo.patientSignature && (
              <View style={styles.signatureField}>
                <Text style={styles.fieldLabel}>Patient Signature:</Text>
                <Text style={styles.signaturePresent}>✓ Signature captured</Text>
              </View>
            )}
            {refusalInfo.witnessSignature && (
              <View style={styles.signatureField}>
                <Text style={styles.fieldLabel}>Witness Signature:</Text>
                <Text style={styles.signaturePresent}>✓ Signature captured</Text>
              </View>
            )}
            {refusalInfo.paramedicSignature && (
              <View style={styles.signatureField}>
                <Text style={styles.fieldLabel}>Paramedic Signature:</Text>
                <Text style={styles.signaturePresent}>✓ Signature captured</Text>
              </View>
            )}
          </View>
        )}

        {renderSection(
          "Signatures",
          <View>
            {signatureInfo.nurseSignature && (
              <View style={styles.signatureField}>
                <Text style={styles.fieldLabel}>Nurse Signature:</Text>
                <Text style={styles.signaturePresent}>✓ Signature captured</Text>
                {renderField("Corporation ID", signatureInfo.nurseCorporationId)}
              </View>
            )}
            {signatureInfo.doctorSignature && (
              <View style={styles.signatureField}>
                <Text style={styles.fieldLabel}>Doctor Signature:</Text>
                <Text style={styles.signaturePresent}>✓ Signature captured</Text>
                {renderField("Corporation ID", signatureInfo.doctorCorporationId)}
              </View>
            )}
            {signatureInfo.othersSignature && (
              <View style={styles.signatureField}>
                <Text style={styles.fieldLabel}>Other Signature:</Text>
                <Text style={styles.signaturePresent}>✓ Signature captured</Text>
                {renderField("Role", signatureInfo.othersRole)}
              </View>
            )}
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
              <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Sending to Teams...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Send size={20} color="#fff" />
              <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Submit Report</Text>
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

});
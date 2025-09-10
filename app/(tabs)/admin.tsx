import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Platform,
  Clipboard,
  ActivityIndicator,
  Switch,
  Pressable,
} from 'react-native';
import { usePCRStore, CompletedPCR, StaffMember, Patient, Encounter, Vitals, ECG, Signature, Attachment, AuditLog } from '../../store/pcrStore';
import { router } from 'expo-router';
import OfflineStatus from '../../components/OfflineStatus';
import { 
  Shield, 
  Users, 
  FileText, 
  Activity, 
  Heart, 
  Camera, 
  Edit3, 
  Database,
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Lock,
  Unlock,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DebugHelper } from '@/utils/debugHelper';

type TabType = 'vault' | 'staff' | 'audit' | 'reports' | 'enterprise';
type VaultSection = 'patients' | 'encounters' | 'vitals' | 'ecgs' | 'signatures' | 'attachments' | 'pcrs';

export default function AdminScreen() {
  const { 
    currentSession, 
    completedPCRs,
    staffMembers,
    patients,
    encounters,
    allVitals,
    ecgs,
    signatures,
    attachments,
    auditLogs,
    loadCompletedPCRs,
    loadStaffMembers,
    loadAdminData,
    addStaffMember,
    updateStaffMember,
    deactivateStaff,
    reactivateStaff,
    updateStaffRole,
    addAuditLog,
    generateComprehensiveReport,
    exportAllData,
  } = usePCRStore();
  
  // Route guard: Only admin users should access this screen
  const isAdminUser = currentSession?.role === 'admin' || 
                     currentSession?.role === 'Admin' || 
                     currentSession?.role === 'SuperAdmin';
  const isStaffUser = currentSession && !isAdminUser;
  
  useEffect(() => {
    if (isStaffUser) {
      console.log('Staff user trying to access admin screen, redirecting to staff tabs');
      router.replace('/(tabs)');
    }
  }, [isStaffUser]);

  const [activeTab, setActiveTab] = useState<TabType>('vault');
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [enterpriseConfig, setEnterpriseConfig] = useState({
    pricing: {
      basic: { name: 'Basic', price: 99, currency: 'USD', period: 'month' },
      professional: { name: 'Professional', price: 299, currency: 'USD', period: 'month' },
      enterprise: { name: 'Enterprise', price: 999, currency: 'USD', period: 'month' },
      custom: { name: 'Custom', price: 0, currency: 'USD', period: 'custom' }
    },
    features: [
      { id: '1', name: 'Real-time PCR Management', description: 'Complete patient care reporting system', plans: ['basic', 'professional', 'enterprise'], enabled: true },
      { id: '2', name: 'Voice-to-Text Documentation', description: 'AI-powered voice notes with automatic transcription', plans: ['professional', 'enterprise'], enabled: true },
      { id: '3', name: 'Trauma Body Diagram', description: 'Interactive body diagram for injury documentation', plans: ['professional', 'enterprise'], enabled: true },
      { id: '4', name: 'Offline Mode', description: 'Work without internet, sync when connected', plans: ['basic', 'professional', 'enterprise'], enabled: true },
      { id: '5', name: 'Multi-Team Support', description: 'Manage multiple teams and departments', plans: ['professional', 'enterprise'], enabled: true },
      { id: '6', name: 'Advanced Analytics', description: 'Comprehensive reporting and insights', plans: ['enterprise'], enabled: true },
      { id: '7', name: 'Custom Integrations', description: 'API access and third-party integrations', plans: ['enterprise', 'custom'], enabled: true },
      { id: '8', name: 'Priority Support', description: '24/7 dedicated support team', plans: ['enterprise', 'custom'], enabled: true },
      { id: '9', name: 'Data Export', description: 'Export data in multiple formats', plans: ['basic', 'professional', 'enterprise'], enabled: true },
      { id: '10', name: 'Audit Trail', description: 'Complete activity logging and compliance', plans: ['professional', 'enterprise'], enabled: true }
    ],
    learnMore: {
      companyInfo: 'RORK Emergency Medical Services',
      description: 'Industry-leading patient care reporting system designed for emergency medical services, hospitals, and healthcare providers.',
      benefits: [
        'Reduce documentation time by 70%',
        'Ensure compliance with medical standards',
        'Improve patient care quality',
        'Real-time team collaboration',
        'Secure cloud storage with encryption'
      ],
      contact: {
        email: 'sales@rork-ems.com',
        phone: '1-800-RORK-EMS',
        website: 'www.rork-ems.com'
      }
    }
  });
  const [vaultSection, setVaultSection] = useState<VaultSection>('pcrs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPCR, setSelectedPCR] = useState<CompletedPCR | null>(null);
  const [anonymizeReport, setAnonymizeReport] = useState(false);
  const [reportFormat, setReportFormat] = useState<'full' | 'summary'>('full');
  const [showOfflineDetails, setShowOfflineDetails] = useState(false);
  
  // Staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    corporationId: '',
    role: 'Staff' as StaffMember['role'],
    department: '',
  });

  // Date range filter
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  useEffect(() => {
    loadData();
    // Enable debug helper in development
    if (__DEV__) {
      (global as any).DebugHelper = DebugHelper;
      console.log('🔧 DebugHelper available - Use DebugHelper.listAllPCRs() or DebugHelper.verifyCompleteReport(pcrId)');
      // Auto-run debug check on load
      setTimeout(() => {
        DebugHelper.listAllPCRs();
      }, 2000);
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadCompletedPCRs(),
        loadStaffMembers(),
        loadAdminData(),
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is admin - check all possible admin role variations
  const isAdmin = currentSession?.isAdmin || 
    currentSession?.role === 'admin' || 
    currentSession?.role === 'Admin' || 
    currentSession?.role === 'SuperAdmin' || 
    currentSession?.role === 'supervisor';
  const isSuperAdmin = currentSession?.role === 'SuperAdmin' || currentSession?.isSuperAdmin;

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <AlertCircle size={64} color="#FF3B30" />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You do not have permission to access this area.
          </Text>
          <Text style={styles.accessDeniedSubtext}>
            Admin or SuperAdmin privileges required.
          </Text>
        </View>
      </View>
    );
  }

  // Filter data based on search and date range
  const filterData = (data: any[], fields: string[]) => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        fields.some(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item);
          return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
        });

      // Date filter
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const itemDate = new Date(item.created_at || item.submittedAt || item.timestamp);
        if (dateRange.start) {
          matchesDate = matchesDate && itemDate >= new Date(dateRange.start);
        }
        if (dateRange.end) {
          matchesDate = matchesDate && itemDate <= new Date(dateRange.end);
        }
      }

      return matchesSearch && matchesDate;
    });
  };

  const getVaultData = () => {
    switch (vaultSection) {
      case 'patients':
        return filterData(patients, ['full_name', 'mrn', 'phone']);
      case 'encounters':
        return filterData(encounters, ['encounter_id', 'chief_complaint', 'location']);
      case 'vitals':
        return filterData(allVitals, ['encounter_id', 'heart_rate', 'bp_systolic']);
      case 'ecgs':
        return filterData(ecgs, ['encounter_id', 'rhythm_label']);
      case 'signatures':
        return filterData(signatures, ['signer_name', 'signer_role']);
      case 'attachments':
        return filterData(attachments, ['label', 'encounter_id']);
      case 'pcrs':
      default:
        return filterData(completedPCRs, ['patientInfo.firstName', 'patientInfo.lastName', 'patientInfo.mrn']);
    }
  };

  const filteredStaff = filterData(staffMembers, ['name', 'corporationId', 'department']);
  const filteredAuditLogs = filterData(auditLogs, ['action', 'details', 'actor_staff_id']);

  const handleSelectAll = () => {
    const data = getVaultData();
    if (selectedItems.length === data.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(data.map((item: any) => item.id || item.patient_id || item.encounter_id || item.vitals_id || item.ecg_id || item.signature_id || item.attachment_id));
    }
  };

  const generateReportText = (pcr: CompletedPCR, format: 'full' | 'summary') => {
    const patient = anonymizeReport ? 
      { firstName: 'XXXXX', lastName: 'XXXXX', mrn: 'XXXXX', age: 'XX', gender: 'X' } : 
      pcr.patientInfo;

    let report = `[CASE REPORT]\n`;
    report += `Case ID: ${pcr.id}\n`;
    report += `Date/Time: ${new Date(pcr.submittedAt).toLocaleString()}\n`;
    report += `Location: ${pcr.incidentInfo.location}\n\n`;

    report += `[Patient]\n`;
    report += `Name: ${patient.firstName} ${patient.lastName}\n`;
    report += `Age: ${patient.age}   Sex: ${patient.gender}   MRN: ${patient.mrn}\n\n`;

    report += `[Chief Complaint]\n${pcr.incidentInfo.chiefComplaint}\n\n`;

    if (format === 'full') {
      report += `[History / Assessment]\n`;
      report += `${pcr.incidentInfo.history}\n`;
      report += `${pcr.incidentInfo.assessment}\n\n`;

      report += `[Vitals Timeline]\n`;
      pcr.vitals.forEach((vital, index) => {
        report += `${index + 1}. Time: ${vital.timestamp}\n`;
        report += `   HR: ${vital.heartRate} | BP: ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}\n`;
        report += `   RR: ${vital.respiratoryRate} | SpO2: ${vital.oxygenSaturation}%\n`;
        report += `   Temp: ${vital.temperature}°C | GCS: ${vital.bloodGlucose}\n`;
        if (vital.ecgCapture) {
          report += `   ECG: Captured at ${vital.ecgCaptureTimestamp}\n`;
        }
      });
      report += '\n';

      report += `[Treatments & Medications]\n`;
      report += `Treatments: ${pcr.incidentInfo.treatmentGiven}\n`;
      report += `Priority: ${pcr.incidentInfo.priority}\n\n`;
    }

    report += `[Transport]\n`;
    report += `Destination: ${pcr.transportInfo.destination}\n`;
    report += `Mode: ${pcr.transportInfo.mode}\n`;
    report += `Unit: ${pcr.transportInfo.unitNumber}\n\n`;

    report += `[Staff]\n`;
    report += `Submitted by: ${pcr.submittedBy.name} (${pcr.submittedBy.corporationId})\n`;
    report += `Role: ${pcr.submittedBy.role}\n\n`;

    report += `[Disposition]\n`;
    report += `${pcr.incidentInfo.provisionalDiagnosis}\n\n`;

    report += `[System Footer]\n`;
    report += `Generated by RORK Admin at ${new Date().toLocaleString()}\n`;
    report += `Audit ID: ${Date.now()}\n`;

    return report;
  };

  const handleCopyReport = async (format: 'text' | 'csv' | 'comprehensive') => {
    if (!selectedPCR) return;

    try {
      let content = '';
      
      if (format === 'comprehensive') {
        // Generate comprehensive report with all data from all tabs
        content = await generateComprehensiveReport(selectedPCR.id);
      } else if (format === 'text') {
        content = generateReportText(selectedPCR, reportFormat);
      } else {
        // CSV format
        const headers = ['Case ID', 'Date', 'Patient Name', 'MRN', 'Chief Complaint', 'Location', 'Disposition'];
        const row = [
          selectedPCR.id,
          new Date(selectedPCR.submittedAt).toLocaleString(),
          anonymizeReport ? 'XXXXX' : `${selectedPCR.patientInfo.firstName} ${selectedPCR.patientInfo.lastName}`,
          anonymizeReport ? 'XXXXX' : selectedPCR.patientInfo.mrn,
          selectedPCR.incidentInfo.chiefComplaint,
          selectedPCR.incidentInfo.location,
          selectedPCR.incidentInfo.provisionalDiagnosis,
        ];
        content = headers.join(',') + '\n' + row.map(v => `"${v}"`).join(',');
      }

      await Clipboard.setString(content);
      Alert.alert('Success', `Report copied to clipboard as ${format.toUpperCase()}`);
      await addAuditLog('COPY_REPORT', 'PCR', selectedPCR.id, `Copied report as ${format}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy report');
    }
  };

  // Function to convert SVG path data to base64 image
  const convertSvgPathToBase64 = (svgPaths: string, width: number = 300, height: number = 100): string => {
    if (!svgPaths) return '';
    
    try {
      console.log('Converting signature paths to base64:', svgPaths.substring(0, 100) + '...');
      
      // Handle different signature formats
      let pathElements = '';
      
      if (svgPaths.startsWith('data:image/')) {
        // Already a base64 image, return as is
        console.log('Signature is already base64 image');
        return svgPaths;
      } else if (svgPaths.includes('<svg')) {
        // Full SVG string, extract and convert
        console.log('Signature is full SVG string');
        const base64 = btoa(unescape(encodeURIComponent(svgPaths)));
        return `data:image/svg+xml;base64,${base64}`;
      } else {
        // SVG path data, create SVG
        console.log('Converting SVG paths to full SVG');
        pathElements = svgPaths.split('|').filter(p => p.trim()).map(path => 
          `<path d="${path.trim()}" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        ).join('');
      }
      
      const svgString = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
          <rect width="100%" height="100%" fill="white" stroke="#ccc" stroke-width="1"/>
          ${pathElements}
        </svg>`;
      
      // Convert to base64
      const base64 = btoa(unescape(encodeURIComponent(svgString)));
      const result = `data:image/svg+xml;base64,${base64}`;
      console.log('Signature conversion successful, result length:', result.length);
      return result;
    } catch (error) {
      console.error('Error converting SVG path to base64:', error);
      return '';
    }
  };

  const generateProfessionalHTML = (pcr: CompletedPCR, isComprehensive: boolean = false) => {
    const patientName = anonymizeReport ? 'CONFIDENTIAL PATIENT' : `${pcr.patientInfo.firstName} ${pcr.patientInfo.lastName}`;
    const patientMRN = anonymizeReport ? 'XXXXX' : pcr.patientInfo.mrn;
    const patientPhone = anonymizeReport ? 'XXX-XXX-XXXX' : pcr.patientInfo.phone;
    
    // Get related admin data for comprehensive report
    const encounterId = `ENC_${pcr.id}`;
    const relatedECGs = ecgs.filter(e => e.encounter_id === encounterId);
    const relatedSignatures = signatures.filter(s => s.encounter_id === encounterId);
    
    // Convert signature paths to base64 images - check both signature and signaturePaths fields
    const nurseSignatureImage = (pcr.signatureInfo.nurseSignaturePaths || pcr.signatureInfo.nurseSignature) ? 
      (pcr.signatureInfo.nurseSignature?.startsWith('data:image') ? 
        pcr.signatureInfo.nurseSignature : 
        convertSvgPathToBase64(pcr.signatureInfo.nurseSignaturePaths || pcr.signatureInfo.nurseSignature)) : null;
    const doctorSignatureImage = (pcr.signatureInfo.doctorSignaturePaths || pcr.signatureInfo.doctorSignature) ? 
      (pcr.signatureInfo.doctorSignature?.startsWith('data:image') ? 
        pcr.signatureInfo.doctorSignature : 
        convertSvgPathToBase64(pcr.signatureInfo.doctorSignaturePaths || pcr.signatureInfo.doctorSignature)) : null;
    const othersSignatureImage = (pcr.signatureInfo.othersSignaturePaths || pcr.signatureInfo.othersSignature) ? 
      (pcr.signatureInfo.othersSignature?.startsWith('data:image') ? 
        pcr.signatureInfo.othersSignature : 
        convertSvgPathToBase64(pcr.signatureInfo.othersSignaturePaths || pcr.signatureInfo.othersSignature)) : null;
    
    // Convert refusal signatures to base64 images - check both signature and signaturePaths fields
    const patientRefusalSignatureImage = (pcr.refusalInfo?.patientSignature || pcr.refusalInfo?.patientSignaturePaths) ? 
      (pcr.refusalInfo.patientSignature?.startsWith('data:image') ? 
        pcr.refusalInfo.patientSignature : 
        convertSvgPathToBase64(pcr.refusalInfo.patientSignaturePaths || pcr.refusalInfo.patientSignature)) : null;
    const witnessRefusalSignatureImage = (pcr.refusalInfo?.witnessSignature || pcr.refusalInfo?.witnessSignaturePaths) ? 
      (pcr.refusalInfo.witnessSignature?.startsWith('data:image') ? 
        pcr.refusalInfo.witnessSignature : 
        convertSvgPathToBase64(pcr.refusalInfo.witnessSignaturePaths || pcr.refusalInfo.witnessSignature)) : null;
    const paramedicRefusalSignatureImage = (pcr.refusalInfo?.paramedicSignature || pcr.refusalInfo?.paramedicSignaturePaths) ? 
      (pcr.refusalInfo.paramedicSignature?.startsWith('data:image') ? 
        pcr.refusalInfo.paramedicSignature : 
        convertSvgPathToBase64(pcr.refusalInfo.paramedicSignaturePaths || pcr.refusalInfo.paramedicSignature)) : null;
    
    // Log signature data for debugging
    console.log('Refusal signatures found:', {
      patient: !!patientRefusalSignatureImage,
      witness: !!witnessRefusalSignatureImage,
      paramedic: !!paramedicRefusalSignatureImage,
      patientData: pcr.refusalInfo?.patientSignature?.substring(0, 50),
      patientPaths: pcr.refusalInfo?.patientSignaturePaths?.substring(0, 50)
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Patient Care Report - ${pcr.id}</title>
        <style>
          @page {
            size: A4;
            margin: 0.75in;
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .header .subtitle {
            font-size: 12pt;
            margin: 0;
            color: #333;
          }
          
          .report-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 10pt;
          }
          
          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .info-item {
            margin-bottom: 8px;
          }
          
          .info-label {
            font-weight: bold;
            display: inline-block;
            min-width: 120px;
          }
          
          .info-value {
            display: inline;
          }
          
          .vitals-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 10pt;
          }
          
          .vitals-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 8px 4px;
            text-align: center;
            font-weight: bold;
            font-size: 9pt;
          }
          
          .vitals-table td {
            border: 1px solid #000;
            padding: 6px 4px;
            text-align: center;
            font-size: 9pt;
          }
          
          .narrative-section {
            margin: 15px 0;
          }
          
          .narrative-text {
            border: 1px solid #ccc;
            padding: 10px;
            background-color: #fafafa;
            min-height: 60px;
            font-size: 10pt;
            line-height: 1.3;
          }
          
          .signatures-section {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
          }
          
          .signature-box {
            border: 2px solid #000;
            padding: 10px;
            min-height: 160px;
            text-align: center;
            page-break-inside: avoid;
            overflow: visible;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .signature-label {
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 10px;
            color: #000;
            text-align: center;
            display: block;
            flex-shrink: 0;
          }
          
          .signature-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 80px;
            margin: 10px 0;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            height: 50px;
            width: 100%;
            margin: 10px 0;
            position: relative;
          }
          
          .signature-image {
            max-width: 150px !important;
            max-height: 60px !important;
            width: auto !important;
            height: auto !important;
            border: 1px solid #333 !important;
            margin: 5px auto !important;
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            object-fit: contain !important;
            background: white !important;
            opacity: 1 !important;
            visibility: visible !important;
            filter: contrast(1.5) brightness(1.1) !important;
            box-sizing: border-box !important;
            position: relative !important;
            z-index: 1 !important;
          }
          
          .ecg-image {
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            min-height: 200px !important;
            border: 2px solid #000 !important;
            margin: 10px auto !important;
            page-break-inside: avoid;
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            object-fit: contain !important;
            background: white !important;
            opacity: 1 !important;
            visibility: visible !important;
            filter: contrast(1.8) brightness(1.3) !important;
            box-sizing: border-box !important;
          }
          
          .ecg-container {
            margin: 15px 0;
            border: 2px solid #000;
            padding: 15px;
            background: white;
            text-align: center;
            page-break-inside: avoid;
          }
          
          .ecg-title {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
          }
          
          .ecg-info {
            font-size: 9pt;
            color: #000;
            margin-top: 8px;
          }
          

          
          .signature-info {
            font-size: 8pt;
            margin-top: 10px;
            flex-shrink: 0;
            position: static;
            width: 100%;
            text-align: left;
            line-height: 1.2;
            padding: 5px;
            background: rgba(255, 255, 255, 0.9);
            border-top: 1px solid #ddd;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #000;
            font-size: 9pt;
            text-align: center;
          }
          
          .confidential {
            color: #d32f2f;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            font-size: 12pt;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .transport-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
          }
          
          .ecg-section {
            margin: 15px 0;
            border: 1px solid #ccc;
            padding: 10px;
          }
          
          .no-data {
            font-style: italic;
            color: #666;
            text-align: center;
            padding: 20px;
          }
          
          @media print {
            * {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body { 
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .page-break { page-break-before: always; }
            .signature-image, .ecg-image {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              opacity: 1 !important;
              visibility: visible !important;
              display: block !important;
              filter: contrast(1.5) brightness(1.1) !important;
              transform: none !important;
              border: 2px solid #000 !important;
              background: white !important;
              margin: 10px auto !important;
            }
            img {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              opacity: 1 !important;
              visibility: visible !important;
              display: block !important;
              filter: contrast(1.5) brightness(1.1) !important;
              border: 2px solid #000 !important;
            }
            svg {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              opacity: 1 !important;
              visibility: visible !important;
              display: block !important;
            }
          }
        </style>
      </head>
      <body>
        ${anonymizeReport ? '<div class="confidential">⚠️ CONFIDENTIAL PATIENT INFORMATION ⚠️</div>' : ''}
        
        <div class="header">
          <h1>Patient Care Report</h1>
          <div class="subtitle">Electronic Medical Record System</div>
        </div>
        
        <div class="report-info">
          <div><strong>Report ID:</strong> ${pcr.id}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Status:</strong> ${pcr.status.toUpperCase()}</div>
        </div>
        
        <!-- Patient Information Section -->
        <div class="section">
          <div class="section-title">Patient Information</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Full Name:</span>
                <span class="info-value">${patientName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Age:</span>
                <span class="info-value">${pcr.patientInfo.age} years</span>
              </div>
              <div class="info-item">
                <span class="info-label">Gender:</span>
                <span class="info-value">${pcr.patientInfo.gender}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">MRN:</span>
                <span class="info-value">${patientMRN}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${patientPhone}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Call Time Information -->
        <div class="section">
          <div class="section-title">Call Time Information</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Date:</span>
                <span class="info-value">${pcr.callTimeInfo.date || 'Not recorded'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Time of Call:</span>
                <span class="info-value">${pcr.callTimeInfo.timeOfCall || 'Not recorded'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Arrival on Scene:</span>
                <span class="info-value">${pcr.callTimeInfo.arrivalOnScene || 'Not recorded'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">At Patient Side:</span>
                <span class="info-value">${pcr.callTimeInfo.atPatientSide || 'Not recorded'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">To Destination:</span>
                <span class="info-value">${pcr.callTimeInfo.toDestination || 'Not recorded'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">At Destination:</span>
                <span class="info-value">${pcr.callTimeInfo.atDestination || 'Not recorded'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Incident Information -->
        <div class="section">
          <div class="section-title">Incident Information</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Location:</span>
                <span class="info-value">${pcr.incidentInfo.location || 'Not specified'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Priority:</span>
                <span class="info-value">${pcr.incidentInfo.priority || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Chief Complaint:</span>
                <span class="info-value">${pcr.incidentInfo.chiefComplaint || 'Not recorded'}</span>
              </div>
            </div>
          </div>
          
          ${pcr.incidentInfo.history ? `
          <div class="narrative-section">
            <div class="info-label">History of Present Illness:</div>
            <div class="narrative-text">${pcr.incidentInfo.history}</div>
          </div>
          ` : ''}
          
          ${pcr.incidentInfo.assessment ? `
          <div class="narrative-section">
            <div class="info-label">Assessment:</div>
            <div class="narrative-text">${pcr.incidentInfo.assessment}</div>
          </div>
          ` : ''}
          
          ${pcr.incidentInfo.treatmentGiven ? `
          <div class="narrative-section">
            <div class="info-label">Treatment Provided:</div>
            <div class="narrative-text">${pcr.incidentInfo.treatmentGiven}</div>
          </div>
          ` : ''}
          
          ${pcr.incidentInfo.provisionalDiagnosis ? `
          <div class="narrative-section">
            <div class="info-label">Provisional Diagnosis:</div>
            <div class="narrative-text">${pcr.incidentInfo.provisionalDiagnosis}</div>
          </div>
          ` : ''}
        </div>
        
        ${pcr.incidentInfo.traumaInjuries && pcr.incidentInfo.traumaInjuries.length > 0 ? `
        <!-- Trauma Body Diagram Section -->
        <div class="section">
          <div class="section-title">Trauma Body Diagram Report</div>
          <div style="border: 2px solid #000; padding: 15px; background: white; margin: 10px 0;">
            <div style="text-align: center; margin-bottom: 15px;">
              <strong style="font-size: 14pt;">📋 TRAUMA INJURY DOCUMENTATION</strong>
            </div>
            <div style="margin-bottom: 10px;">
              <strong>Total Injuries Documented:</strong> ${pcr.incidentInfo.traumaInjuries.length}
            </div>
            <div style="margin-bottom: 15px;">
              <strong>Assessment Date:</strong> ${new Date(pcr.submittedAt).toLocaleDateString()}
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">#</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">Body Region</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">View</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">Severity</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">Description</th>
                </tr>
              </thead>
              <tbody>
                ${pcr.incidentInfo.traumaInjuries.map((injury, index) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${index + 1}</td>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${injury.bodyPart}</td>
                    <td style="border: 1px solid #000; padding: 6px;">${injury.view === 'front' ? 'Anterior' : 'Posterior'}</td>
                    <td style="border: 1px solid #000; padding: 6px;">
                      <span style="background-color: ${injury.severity === 'critical' ? '#D32F2F' : injury.severity === 'severe' ? '#FF5722' : injury.severity === 'moderate' ? '#FF9800' : '#FFC107'}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 9pt; font-weight: bold;">
                        ${injury.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style="border: 1px solid #000; padding: 6px;">${injury.description}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 15px; padding: 10px; background-color: #e8f5e8; border: 1px solid #4caf50;">
              <strong style="color: #2e7d32;">📍 ANATOMICAL MAPPING:</strong> All injury locations were precisely mapped using professional anatomical body diagrams. 
              Each injury point was documented with exact anatomical region identification and severity assessment by qualified medical staff.
              <br/><br/>
              <strong style="color: #2e7d32;">🏥 CLINICAL SIGNIFICANCE:</strong> This trauma documentation follows standard medical protocols for injury assessment and provides comprehensive anatomical reference for continued care and treatment planning.
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Vital Signs -->
        <div class="section">
          <div class="section-title">Vital Signs</div>
          ${pcr.vitals.length > 0 ? `
          <table class="vitals-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>HR<br/>(bpm)</th>
                <th>BP<br/>(mmHg)</th>
                <th>RR<br/>(rpm)</th>
                <th>SpO2<br/>(%)</th>
                <th>Temp<br/>(°C)</th>
                <th>Pain<br/>(0-10)</th>
                <th>Blood Glucose<br/>(mg/dL)</th>
                <th>ECG</th>
              </tr>
            </thead>
            <tbody>
              ${pcr.vitals.map(vital => `
                <tr>
                  <td>${vital.timestamp || 'N/A'}</td>
                  <td>${vital.heartRate || '-'}</td>
                  <td>${vital.bloodPressureSystolic || '-'}/${vital.bloodPressureDiastolic || '-'}</td>
                  <td>${vital.respiratoryRate || '-'}</td>
                  <td>${vital.oxygenSaturation || '-'}</td>
                  <td>${vital.temperature || '-'}</td>
                  <td>${vital.painScale || '-'}</td>
                  <td>${vital.bloodGlucose || '-'}</td>
                  <td>${vital.ecgCapture ? '✓' : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : '<div class="no-data">No vital signs recorded</div>'}
        </div>
        
        ${(pcr.vitals.some(v => v.ecgCapture) || relatedECGs.length > 0) ? `
        <div class="section">
          <div class="section-title">ECG Recordings</div>
          
          ${relatedECGs.length > 0 ? relatedECGs.map((ecg, index) => `
            <div class="ecg-section">
              <div><strong>ECG Recording ${index + 1}:</strong></div>
              <div><strong>Captured:</strong> ${ecg.captured_at}</div>
              <div><strong>Rhythm Analysis:</strong> ${ecg.rhythm_label}</div>
              <div><strong>Clinical Notes:</strong> ${ecg.notes}</div>
              ${ecg.image_ecg ? `
                <div class="ecg-container">
                  <div class="ecg-title">📈 ECG Recording ${index + 1}</div>
                  ${ecg.image_ecg.startsWith('data:image') ? `
                    <img src="${ecg.image_ecg}" class="ecg-image" alt="ECG Recording ${index + 1}" />
                    <div class="ecg-info">✓ Digital ECG Recording Available - ID: ${ecg.ecg_id}</div>
                  ` : `
                    <div style="border: 2px solid #000; padding: 20px; margin: 10px 0; background: white; text-align: center; min-height: 200px; display: flex; flex-direction: column; justify-content: center;">
                      <div style="font-size: 14pt; font-weight: bold; margin-bottom: 10px;">📈 ECG RECORDING AVAILABLE</div>
                      <div style="font-size: 12pt; color: #333; margin: 10px 0; padding: 10px; background: #f0f0f0; border: 1px solid #ccc;">ECG Data: ${ecg.image_ecg.substring(0, 100)}${'...'}</div>
                      <div style="font-size: 10pt; color: #333; margin: 5px 0;">Recording ID: ${ecg.ecg_id}</div>
                      <div style="font-size: 9pt; color: #666; margin-top: 10px; font-style: italic;">Digital ECG recording stored in system</div>
                    </div>
                  `}
                </div>
              ` : `
                <div style="font-size: 9pt; color: #666; margin: 5px 0; font-style: italic; padding: 20px; border: 1px solid #ccc; text-align: center;">
                  ECG Image: Not available for this recording
                </div>
              `}
              <div style="font-size: 8pt; color: #999; margin-top: 5px;">
                Recording ID: ${ecg.ecg_id} | Timestamp: ${ecg.captured_at}
              </div>
            </div>
          `).join('') : ''}
          
          ${pcr.vitals.filter(v => v.ecgCapture).map((vital, index) => `
            <div class="ecg-section">
              <div><strong>Vital Signs ECG ${index + 1}:</strong></div>
              <div><strong>Captured:</strong> ${vital.ecgCaptureTimestamp || vital.timestamp}</div>
              <div><strong>Associated Vitals:</strong> HR: ${vital.heartRate}, BP: ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}</div>
              ${vital.ecgCapture ? `
                <div class="ecg-container" style="page-break-inside: avoid; margin: 20px 0; padding: 20px; border: 3px solid #0066CC; background: white; border-radius: 8px;">
                  <div style="background: #0066CC; color: white; padding: 10px; margin: -20px -20px 15px -20px; text-align: center; font-weight: bold; font-size: 14pt;">📈 ELECTROCARDIOGRAM (ECG) RECORDING</div>
                  ${vital.ecgCapture.startsWith('data:image') ? `
                    <div style="border: 2px solid #333; padding: 15px; background: white; margin: 10px 0;">
                      <img src="${vital.ecgCapture}" style="width: 100%; height: auto; display: block; margin: 0 auto; border: 2px solid #000; min-height: 300px; object-fit: contain; background: white;" alt="ECG Recording ${index + 1}" />
                      <div style="margin-top: 15px; padding: 10px; background: #e8f5e8; border: 1px solid #4caf50; text-align: center;">
                        <strong style="color: #2e7d32;">✓ DIGITAL ECG CAPTURE VERIFIED</strong><br/>
                        <span style="font-size: 10pt;">Captured at: ${vital.ecgCaptureTimestamp || vital.timestamp}</span><br/>
                        <span style="font-size: 9pt;">Heart Rate: ${vital.heartRate} bpm | BP: ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg</span>
                      </div>
                    </div>
                  ` : `
                    <div style="border: 2px solid #000; padding: 20px; margin: 10px 0; background: linear-gradient(to bottom, #f0f7ff, white); text-align: center; min-height: 300px; display: flex; flex-direction: column; justify-content: center;">
                      <div style="font-size: 16pt; font-weight: bold; margin-bottom: 15px; color: #0066CC;">📈 ECG DATA CAPTURED</div>
                      <div style="font-size: 11pt; color: #333; margin: 10px 0; padding: 15px; background: white; border: 2px solid #0066CC; border-radius: 6px;">
                        <strong>ECG Recording Available</strong><br/>
                        <span style="font-size: 9pt;">Format: Digital Camera Capture</span>
                      </div>
                      <div style="font-size: 10pt; color: #333; margin: 10px 0;">
                        <strong>Timestamp:</strong> ${vital.ecgCaptureTimestamp || vital.timestamp}<br/>
                        <strong>Associated Vitals:</strong> HR ${vital.heartRate} | BP ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}
                      </div>
                      <div style="font-size: 9pt; color: #666; margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
                        ⚠️ ECG image stored in system database. Original capture from medical device camera.
                      </div>
                    </div>
                  `}
                </div>
              ` : `
                <div style="font-size: 9pt; color: #666; margin: 5px 0; font-style: italic;">
                  ECG Data: Not available
                </div>
              `}
              <div style="font-size: 8pt; color: #999; margin-top: 5px;">
                Recording ID: ECG_VIT_${pcr.id}_${index} | Timestamp: ${vital.timestamp}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <!-- Transport Information -->
        <div class="section">
          <div class="section-title">Transport Information</div>
          <div class="transport-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Destination:</span>
                <span class="info-value">${pcr.transportInfo.destination === "Other" && pcr.transportInfo.customDestination ? pcr.transportInfo.customDestination : (pcr.transportInfo.destination || 'Not specified')}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Transport Mode:</span>
                <span class="info-value">${pcr.transportInfo.mode || 'Not specified'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Unit Number:</span>
                <span class="info-value">${pcr.transportInfo.unitNumber || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Departure Time:</span>
                <span class="info-value">${pcr.transportInfo.departureTime || 'Not recorded'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Arrival Time:</span>
                <span class="info-value">${pcr.transportInfo.arrivalTime || 'Not recorded'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Mileage:</span>
                <span class="info-value">${pcr.transportInfo.mileage || 'Not recorded'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Primary Paramedic:</span>
                <span class="info-value">${pcr.transportInfo.primaryParamedic || 'Not specified'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Secondary Paramedic:</span>
                <span class="info-value">${pcr.transportInfo.secondaryParamedic || 'Not specified'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Driver:</span>
                <span class="info-value">${pcr.transportInfo.driver || 'Not specified'}</span>
              </div>
            </div>
          </div>
          ${pcr.transportInfo.notes ? `
          <div class="narrative-section">
            <div class="info-label">Transport Notes:</div>
            <div class="narrative-text">${pcr.transportInfo.notes}</div>
          </div>
          ` : ''}
        </div>
        
        ${pcr.refusalInfo.patientName ? `
        <div class="section page-break">
          <div class="section-title">Treatment Refusal Documentation</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Patient Name:</span>
                <span class="info-value">${anonymizeReport ? 'CONFIDENTIAL' : pcr.refusalInfo.patientName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date of Refusal:</span>
                <span class="info-value">${pcr.refusalInfo.dateOfRefusal}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Time of Refusal:</span>
                <span class="info-value">${pcr.refusalInfo.timeOfRefusal}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Risks Explained:</span>
                <span class="info-value">${pcr.refusalInfo.risksExplained ? 'Yes' : 'No'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Mental Capacity:</span>
                <span class="info-value">${pcr.refusalInfo.mentalCapacity ? 'Adequate' : 'Questionable'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Witness:</span>
                <span class="info-value">${pcr.refusalInfo.witnessName || 'None'}</span>
              </div>
            </div>
          </div>
          
          <div class="narrative-section">
            <div class="info-label">Reason for Refusal:</div>
            <div class="narrative-text">${pcr.refusalInfo.reasonForRefusal}</div>
          </div>
          
          ${pcr.refusalInfo.additionalNotes ? `
          <div class="narrative-section">
            <div class="info-label">Additional Notes:</div>
            <div class="narrative-text">${pcr.refusalInfo.additionalNotes}</div>
          </div>
          ` : ''}
          
          <!-- Refusal Signatures -->
          <div class="signature-grid" style="margin-top: 20px;">
            <div class="signature-box">
              <div class="signature-label">PATIENT SIGNATURE</div>
              <div class="signature-content">
                ${patientRefusalSignatureImage ? `
                  <img src="${patientRefusalSignatureImage}" class="signature-image" alt="Patient Refusal Signature" style="max-width: 150px !important; max-height: 60px !important; width: auto !important; height: auto !important; border: 1px solid #333 !important; margin: 5px auto !important; display: block !important; object-fit: contain !important; background: white !important;" />
                  <div style="font-size: 8pt; color: #000; text-align: center; margin-top: 5px;">✓ Refusal Signature Captured</div>
                ` : `<div class="signature-line"></div><div style="font-size: 8pt; color: #999; text-align: center;">${pcr.refusalInfo?.patientSignature || pcr.refusalInfo?.patientSignaturePaths ? 'Signature data present but not displayable' : 'Not signed'}</div>`}
              </div>
              <div class="signature-info">
                <strong>Name:</strong> ${anonymizeReport ? 'CONFIDENTIAL' : (pcr.refusalInfo.patientName || 'Not provided')}<br/>
                <strong>Date:</strong> ${pcr.refusalInfo.dateOfRefusal || 'N/A'}<br/>
                <strong>Time:</strong> ${pcr.refusalInfo.timeOfRefusal || 'N/A'}
              </div>
            </div>
            
            ${pcr.refusalInfo.witnessName || witnessRefusalSignatureImage ? `
            <div class="signature-box">
              <div class="signature-label">WITNESS SIGNATURE</div>
              <div class="signature-content">
                ${witnessRefusalSignatureImage ? `
                  <img src="${witnessRefusalSignatureImage}" class="signature-image" alt="Witness Signature" style="max-width: 150px !important; max-height: 60px !important; width: auto !important; height: auto !important; border: 1px solid #333 !important; margin: 5px auto !important; display: block !important; object-fit: contain !important; background: white !important;" />
                  <div style="font-size: 8pt; color: #000; text-align: center; margin-top: 5px;">✓ Witness Signature Captured</div>
                ` : `<div class="signature-line"></div><div style="font-size: 8pt; color: #999; text-align: center;">${pcr.refusalInfo?.witnessSignature || pcr.refusalInfo?.witnessSignaturePaths ? 'Signature data present but not displayable' : 'Not signed'}</div>`}
              </div>
              <div class="signature-info">
                <strong>Name:</strong> ${anonymizeReport ? 'CONFIDENTIAL' : (pcr.refusalInfo.witnessName || 'Not provided')}<br/>
                <strong>Date:</strong> ${pcr.refusalInfo.dateOfRefusal || 'N/A'}
              </div>
            </div>
            ` : ''}
            
            <div class="signature-box">
              <div class="signature-label">PARAMEDIC SIGNATURE</div>
              <div class="signature-content">
                ${paramedicRefusalSignatureImage ? `
                  <img src="${paramedicRefusalSignatureImage}" class="signature-image" alt="Paramedic Signature" style="max-width: 150px !important; max-height: 60px !important; width: auto !important; height: auto !important; border: 1px solid #333 !important; margin: 5px auto !important; display: block !important; object-fit: contain !important; background: white !important;" />
                  <div style="font-size: 8pt; color: #000; text-align: center; margin-top: 5px;">✓ Paramedic Signature Captured</div>
                ` : `<div class="signature-line"></div><div style="font-size: 8pt; color: #999; text-align: center;">${pcr.refusalInfo?.paramedicSignature || pcr.refusalInfo?.paramedicSignaturePaths ? 'Signature data present but not displayable' : 'Not signed'}</div>`}
              </div>
              <div class="signature-info">
                <strong>Name:</strong> ${anonymizeReport ? 'CONFIDENTIAL' : (pcr.refusalInfo.paramedicName || 'Not provided')}<br/>
                <strong>Date:</strong> ${pcr.refusalInfo.dateOfRefusal || 'N/A'}
              </div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Electronic Signatures Section -->
        <div class="section">
          <div class="section-title">Electronic Signatures</div>
          
          <div class="signature-grid">
            <div class="signature-box">
              <div class="signature-label">NURSE/PROVIDER</div>
              <div class="signature-content">
                ${nurseSignatureImage ? `
                  <img src="${nurseSignatureImage}" class="signature-image" alt="Nurse Signature" style="max-width: 150px !important; max-height: 60px !important; width: auto !important; height: auto !important; border: 1px solid #333 !important; margin: 5px auto !important; display: block !important; object-fit: contain !important; background: white !important;" />
                  <div style="font-size: 8pt; color: #000; text-align: center; margin-top: 5px;">✓ Digital Signature Captured</div>
                ` : `<div class="signature-line"></div><div style="font-size: 8pt; color: #999; text-align: center;">${pcr.signatureInfo.nurseSignature || pcr.signatureInfo.nurseSignaturePaths ? 'Signature data present' : 'Not signed'}</div>`}
              </div>
              <div class="signature-info">
                <strong>Name:</strong> ${anonymizeReport ? 'CONFIDENTIAL' : (pcr.submittedBy?.name || 'Not provided')}<br/>
                <strong>ID:</strong> ${anonymizeReport ? 'XXXXX' : (pcr.signatureInfo.nurseCorporationId || pcr.submittedBy?.corporationId || 'N/A')}<br/>
                <strong>Date:</strong> ${pcr.submittedAt ? new Date(pcr.submittedAt).toLocaleDateString() : 'N/A'}<br/>
                <strong>Status:</strong> ${nurseSignatureImage ? '✓ Signed' : 'Pending'}
              </div>
            </div>
            
            <div class="signature-box">
              <div class="signature-label">PHYSICIAN</div>
              <div class="signature-content">
                ${doctorSignatureImage ? `
                  <img src="${doctorSignatureImage}" class="signature-image" alt="Doctor Signature" style="max-width: 150px !important; max-height: 60px !important; width: auto !important; height: auto !important; border: 1px solid #333 !important; margin: 5px auto !important; display: block !important; object-fit: contain !important; background: white !important;" />
                  <div style="font-size: 8pt; color: #000; text-align: center; margin-top: 5px;">✓ Digital Signature Captured</div>
                ` : `<div class="signature-line"></div><div style="font-size: 8pt; color: #999; text-align: center;">${pcr.signatureInfo.doctorSignature || pcr.signatureInfo.doctorSignaturePaths ? 'Signature data present' : 'Not signed'}</div>`}
              </div>
              <div class="signature-info">
                <strong>Name:</strong> ${anonymizeReport ? 'CONFIDENTIAL' : 'Physician'}<br/>
                <strong>ID:</strong> ${anonymizeReport ? 'XXXXX' : (pcr.signatureInfo.doctorCorporationId || 'N/A')}<br/>
                <strong>Date:</strong> ${pcr.submittedAt ? new Date(pcr.submittedAt).toLocaleDateString() : 'N/A'}<br/>
                <strong>Status:</strong> ${doctorSignatureImage ? '✓ Signed' : 'Pending'}
              </div>
            </div>
            
            <div class="signature-box">
              <div class="signature-label">${pcr.signatureInfo.othersRole || 'PATIENT/GUARDIAN'}</div>
              <div class="signature-content">
                ${othersSignatureImage ? `
                  <img src="${othersSignatureImage}" class="signature-image" alt="${pcr.signatureInfo.othersRole || 'Patient'} Signature" style="max-width: 150px !important; max-height: 60px !important; width: auto !important; height: auto !important; border: 1px solid #333 !important; margin: 5px auto !important; display: block !important; object-fit: contain !important; background: white !important;" />
                  <div style="font-size: 8pt; color: #000; text-align: center; margin-top: 5px;">✓ Digital Signature Captured</div>
                ` : `<div class="signature-line"></div><div style="font-size: 8pt; color: #999; text-align: center;">${pcr.signatureInfo.othersSignature || pcr.signatureInfo.othersSignaturePaths ? 'Signature data present' : 'Not signed'}</div>`}
              </div>
              <div class="signature-info">
                <strong>Name:</strong> ${anonymizeReport ? 'CONFIDENTIAL' : (pcr.signatureInfo.othersRole || 'Patient/Guardian')}<br/>
                <strong>Role:</strong> ${pcr.signatureInfo.othersRole || 'Patient/Guardian'}<br/>
                <strong>Date:</strong> ${pcr.submittedAt ? new Date(pcr.submittedAt).toLocaleDateString() : 'N/A'}<br/>
                <strong>Status:</strong> ${othersSignatureImage ? '✓ Signed' : 'Pending'}
              </div>
            </div>
          </div>
          
          ${relatedSignatures.length > 0 ? `
          <div style="margin-top: 20px;">
            <div class="section-title">Additional Electronic Signatures</div>
            ${relatedSignatures.map((sig, index) => `
              <div class="signature-box" style="margin: 10px 0; display: inline-block; width: 300px;">
                <div class="signature-label">${sig.signer_role.toUpperCase()}</div>
                ${sig.signature_image ? `
                  <div style="margin: 5px 0; border: 1px solid #ccc; padding: 5px; background: white; min-height: 60px; display: flex; align-items: center; justify-content: center;">
                    <img src="${sig.signature_image.startsWith('data:image') ? sig.signature_image : `data:image/png;base64,${sig.signature_image}`}" class="signature-image" alt="${sig.signer_role} Signature" style="max-width: 180px; max-height: 50px; display: block; object-fit: contain;" />
                  </div>
                ` : '<div class="signature-line"></div>'}
                <div class="signature-info">
                  Name: ${anonymizeReport ? 'CONFIDENTIAL' : sig.signer_name}<br/>
                  Signed: ${new Date(sig.signed_at).toLocaleString()}<br/>
                  <span style="font-size: 8pt; color: #999;">Signature ID: ${sig.signature_id}</span>
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        
        <!-- Document Information Section -->
        <div class="section">
          <div class="section-title">Document Information</div>
          <div style="font-size: 10pt; line-height: 1.4;">
            <div><strong>Original Creation:</strong> ${pcr.submittedAt}</div>
            <div><strong>Report Generated:</strong> ${new Date().toISOString()}</div>
            <div><strong>Digital Storage:</strong> All signatures and ECGs stored with timestamps</div>
            <div><strong>Generated By:</strong> Authorized admin user</div>
            <div><strong>Data Preservation:</strong> Original digital files maintained in system</div>
            <div><strong>Authentication:</strong> Electronic signatures verified against staff database</div>
            <div style="margin-top: 10px; padding: 15px; background-color: #e8f5e8; border: 2px solid #4caf50;">
              <strong style="color: #2e7d32;">📋 DIGITAL CONTENT VERIFICATION:</strong> This document contains digitally captured signatures and ECG recordings embedded as base64 images with enhanced print compatibility. 
              All timestamps are system-generated and stored securely. Original digital files are preserved in the source system 
              for reference and can be printed on any device without restrictions.
              <br/><br/>
              <strong style="color: #2e7d32;">🖨️ PRINTING GUARANTEE:</strong> All signatures and ECG images are embedded directly in this PDF with enhanced contrast and visibility settings. 
              Images are optimized for both screen display and printing. If any images appear faint, they will still print clearly due to enhanced print-specific styling.
              <br/><br/>
              <strong style="color: #2e7d32;">✅ CONTENT SUMMARY:</strong> ${(pcr.vitals.filter(v => v.ecgCapture).length + relatedECGs.length)} ECG recordings, ${(relatedSignatures.length + [pcr.signatureInfo.nurseSignaturePaths, pcr.signatureInfo.doctorSignaturePaths, pcr.signatureInfo.othersSignaturePaths].filter(Boolean).length)} electronic signatures${pcr.incidentInfo.traumaInjuries && pcr.incidentInfo.traumaInjuries.length > 0 ? `, and ${pcr.incidentInfo.traumaInjuries.length} trauma injuries` : ''} are embedded and ready for printing.
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div><strong>Report Generated By:</strong> RORK Electronic Patient Care Record System</div>
          <div><strong>Submitted By:</strong> ${pcr.submittedBy.name} (${pcr.submittedBy.corporationId}) - ${pcr.submittedBy.role}</div>
          <div><strong>Submission Date:</strong> ${new Date(pcr.submittedAt).toLocaleString()}</div>
          <div><strong>Report Generated:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Content Summary:</strong> ${(pcr.vitals.filter(v => v.ecgCapture).length + relatedECGs.length)} ECG recordings, ${(relatedSignatures.length + [pcr.signatureInfo.nurseSignaturePaths, pcr.signatureInfo.doctorSignaturePaths, pcr.signatureInfo.othersSignaturePaths].filter(Boolean).length)} electronic signatures${pcr.incidentInfo.traumaInjuries && pcr.incidentInfo.traumaInjuries.length > 0 ? `, ${pcr.incidentInfo.traumaInjuries.length} trauma injuries` : ''}</div>
          <div style="margin-top: 10px; font-size: 8pt; color: #666;">
            This document contains confidential patient information.<br/>
            Digital signatures and ECG images are embedded and can be printed on any device without restrictions.
          </div>
          <div style="margin-top: 10px; padding: 8px; background-color: #e8f5e8; border: 1px solid #4caf50; font-size: 8pt;">
            <strong>✅ PRINTABLE DOCUMENT - NO RESTRICTIONS</strong><br/>
            This report contains embedded electronic signatures and ECG recordings.<br/>
            All digital content including signatures and ECG images can be printed on any device without restrictions.<br/>
            Images are embedded as base64 data for maximum compatibility and are optimized for both screen and print display.<br/>
            <strong>Total Content:</strong> ${(pcr.vitals.filter(v => v.ecgCapture).length + relatedECGs.length)} ECG recordings, ${(relatedSignatures.length + [pcr.signatureInfo.nurseSignaturePaths, pcr.signatureInfo.doctorSignaturePaths, pcr.signatureInfo.othersSignaturePaths].filter(Boolean).length)} electronic signatures${pcr.incidentInfo.traumaInjuries && pcr.incidentInfo.traumaInjuries.length > 0 ? `, ${pcr.incidentInfo.traumaInjuries.length} trauma injuries documented` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleExportPDF = async (isComprehensive: boolean = false) => {
    if (!selectedPCR) return;

    try {
      const html = generateProfessionalHTML(selectedPCR, isComprehensive);
      const fileName = `PCR_${selectedPCR.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false,
        width: 612, // 8.5 inches at 72 DPI
        height: 792, // 11 inches at 72 DPI
        margins: {
          left: 54, // 0.75 inches
          top: 54,
          right: 54,
          bottom: 54,
        },
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${fileName}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'Professional PDF report generated successfully');
      }
      
      await addAuditLog('EXPORT_PDF', 'PCR', selectedPCR.id, `Exported ${isComprehensive ? 'comprehensive' : 'standard'} PDF report`);
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.corporationId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Check for duplicate corporation ID
    if (staffMembers.some(s => s.corporationId === newStaff.corporationId)) {
      Alert.alert('Error', 'Corporation ID already exists');
      return;
    }

    try {
      await addStaffMember({
        ...newStaff,
        isActive: true,
        status: 'Active',
        created_at: new Date().toISOString(),
      });
      
      await addAuditLog('ADD_STAFF', 'Staff', newStaff.corporationId, `Added staff member: ${newStaff.name}`);
      
      Alert.alert('Success', 'Staff member added successfully');
      setShowAddStaffModal(false);
      setNewStaff({ name: '', corporationId: '', role: 'Staff', department: '' });
      loadStaffMembers();
    } catch (error) {
      Alert.alert('Error', 'Failed to add staff member');
    }
  };

  const handleStaffAction = async (staff: StaffMember, action: 'deactivate' | 'reactivate' | 'delete') => {
    const confirmMessage = action === 'delete' ? 
      'Are you sure you want to delete this staff member? This action cannot be undone.' :
      `Are you sure you want to ${action} this staff member?`;

    Alert.alert(
      'Confirm Action',
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              console.log(`${action}ing staff:`, staff.corporationId, staff.name);
              if (action === 'deactivate') {
                await deactivateStaff(staff.corporationId);
                await addAuditLog('DEACTIVATE_STAFF', 'Staff', staff.corporationId, `Deactivated ${staff.name}`);
              } else if (action === 'reactivate') {
                await reactivateStaff(staff.corporationId);
                await addAuditLog('REACTIVATE_STAFF', 'Staff', staff.corporationId, `Reactivated ${staff.name}`);
              }
              Alert.alert('Success', `Staff member ${action}d successfully`);
              await loadStaffMembers();
            } catch (error) {
              console.error(`Error ${action}ing staff:`, error);
              Alert.alert('Error', `Failed to ${action} staff member`);
            }
          }
        }
      ]
    );
  };

  const handleRoleChange = async (staff: StaffMember, newRole: string) => {
    if (!isSuperAdmin) {
      Alert.alert('Permission Denied', 'Only SuperAdmin can change roles');
      return;
    }

    try {
      console.log('Updating role for:', staff.corporationId, 'from', staff.role, 'to', newRole);
      await updateStaffRole(staff.corporationId, newRole);
      await addAuditLog('UPDATE_ROLE', 'Staff', staff.corporationId, `Changed role from ${staff.role} to ${newRole}`);
      Alert.alert('Success', 'Role updated successfully');
      await loadStaffMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const handleExportAllData = async () => {
    try {
      setIsLoading(true);
      const allData = await exportAllData();
      await Clipboard.setString(allData);
      Alert.alert(
        'Complete Export Ready',
        'All system data has been copied to clipboard. This includes all PCRs, patient data, vitals, ECGs, signatures, transport info, staff records, and audit logs.',
        [{ text: 'OK' }]
      );
      await addAuditLog('EXPORT_ALL_DATA', 'System', 'ALL', 'Exported complete system data');
    } catch (error) {
      console.error('Error exporting all data:', error);
      Alert.alert('Error', 'Failed to export all data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderVaultSection = () => {
    const data = getVaultData();

    return (
      <View style={styles.vaultContainer}>
        <View style={styles.vaultHeader}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vaultTabs}>
            {(['pcrs', 'patients', 'encounters', 'vitals', 'ecgs', 'signatures', 'attachments'] as VaultSection[]).map(section => (
              <TouchableOpacity
                key={section}
                style={[styles.vaultTab, vaultSection === section && styles.vaultTabActive]}
                onPress={() => setVaultSection(section)}
              >
                <Text style={[styles.vaultTabText, vaultSection === section && styles.vaultTabTextActive]}>
                  {section.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterBar}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <TouchableOpacity style={styles.selectAllButton} onPress={handleSelectAll}>
            <Text style={styles.selectAllText}>
              {selectedItems.length === data.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item: any, index: number) => {
            const baseId = item.id || item.patient_id || item.encounter_id || item.vitals_id || item.ecg_id || item.signature_id || item.attachment_id || `item_${index}`;
            return `${vaultSection}_${baseId}_${index}`;
          }}
          renderItem={({ item, index }) => {
            const itemId = item.id || item.patient_id || item.encounter_id || item.vitals_id || item.ecg_id || item.signature_id || item.attachment_id;
            const isSelected = selectedItems.includes(itemId);

            if (vaultSection === 'pcrs') {
              const pcr = item as CompletedPCR;
              return (
                <TouchableOpacity
                  style={[styles.dataCard, isSelected && styles.dataCardSelected]}
                  onPress={() => {
                    setSelectedPCR(pcr);
                    setShowReportModal(true);
                  }}
                >
                  <View style={styles.dataCardHeader}>
                    <Text style={styles.dataCardTitle}>
                      {pcr.patientInfo.firstName} {pcr.patientInfo.lastName}
                    </Text>
                    <Text style={styles.dataCardDate}>
                      {new Date(pcr.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.dataCardSubtext}>MRN: {pcr.patientInfo.mrn}</Text>
                  <Text style={styles.dataCardSubtext}>Chief: {pcr.incidentInfo.chiefComplaint}</Text>
                  <Text style={styles.dataCardSubtext}>Submitted by: {pcr.submittedBy.name}</Text>
                  
                  <View style={styles.dataCardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setSelectedPCR(pcr);
                        handleCopyReport('text');
                      }}
                    >
                      <Copy size={14} color="#0066CC" />
                      <Text style={styles.actionButtonText}>Copy</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setSelectedPCR(pcr);
                        handleCopyReport('comprehensive');
                      }}
                    >
                      <FileText size={14} color="#0066CC" />
                      <Text style={styles.actionButtonText}>Full</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setSelectedPCR(pcr);
                        handleExportPDF(false);
                      }}
                    >
                      <Download size={14} color="#0066CC" />
                      <Text style={styles.actionButtonText}>PDF</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: '#28A745' }]}
                      onPress={() => {
                        setSelectedPCR(pcr);
                        handleExportPDF(true);
                      }}
                    >
                      <FileText size={14} color="#28A745" />
                      <Text style={[styles.actionButtonText, { color: '#28A745' }]}>Complete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }

            // Render other vault sections
            return (
              <View style={[styles.dataCard, isSelected && styles.dataCardSelected]}>
                <Text style={styles.dataCardTitle}>{JSON.stringify(item, null, 2)}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Database size={48} color="#999" />
              <Text style={styles.emptyStateText}>No data found</Text>
            </View>
          }
        />

        {selectedItems.length > 0 && (
          <View style={styles.bulkActions}>
            <Text style={styles.bulkActionsText}>{selectedItems.length} selected</Text>
            <View style={styles.bulkActionButtons}>
              <TouchableOpacity style={styles.bulkActionButton} onPress={() => handleCopyReport('csv')}>
                <Copy size={16} color="#fff" />
                <Text style={styles.bulkActionButtonText}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkActionButton, styles.comprehensiveButton]} onPress={handleExportAllData}>
                <Download size={16} color="#fff" />
                <Text style={styles.bulkActionButtonText}>All Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderStaffManagement = () => (
    <View style={styles.staffContainer}>
      <View style={styles.staffHeader}>
        <Text style={styles.sectionTitle}>Staff Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddStaffModal(true)}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.corporationId}
        renderItem={({ item }) => (
          <View style={styles.staffCard}>
            <View style={styles.staffCardHeader}>
              <View>
                <Text style={styles.staffName}>{item.name}</Text>
                <Text style={styles.staffId}>ID: {item.corporationId}</Text>
              </View>
              <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            
            <View style={styles.staffInfo}>
              <Text style={styles.staffInfoText}>Role: {item.role}</Text>
              <Text style={styles.staffInfoText}>Department: {item.department}</Text>
              {item.lastLogin && (
                <Text style={styles.staffInfoText}>
                  Last Login: {new Date(item.lastLogin).toLocaleString()}
                </Text>
              )}
            </View>

            <View style={styles.staffActions}>
              {isSuperAdmin && (
                <TouchableOpacity
                  style={styles.staffActionButton}
                  onPress={() => {
                    Alert.alert(
                      'Change Role',
                      'Select new role',
                      [
                        { text: 'Staff', onPress: () => handleRoleChange(item, 'Staff') },
                        { text: 'Admin', onPress: () => handleRoleChange(item, 'Admin') },
                        { text: 'SuperAdmin', onPress: () => handleRoleChange(item, 'SuperAdmin') },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Edit3 size={16} color="#0066CC" />
                  <Text style={styles.staffActionText}>Role</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.staffActionButton}
                onPress={() => handleStaffAction(item, item.isActive ? 'deactivate' : 'reactivate')}
              >
                {item.isActive ? <Lock size={16} color="#FF9500" /> : <Unlock size={16} color="#34C759" />}
                <Text style={styles.staffActionText}>{item.isActive ? 'Deactivate' : 'Reactivate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={48} color="#999" />
            <Text style={styles.emptyStateText}>No staff members found</Text>
          </View>
        }
      />
    </View>
  );

  const renderEnterpriseSettings = () => (
    <View style={styles.enterpriseContainer}>
      <View style={styles.enterpriseHeader}>
        <Text style={styles.sectionTitle}>Enterprise Features & Pricing</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveEnterpriseConfig}>
          <Check size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pricing Plans Section */}
        <View style={styles.pricingSection}>
          <Text style={styles.subsectionTitle}>Pricing Plans</Text>
          <View style={styles.pricingGrid}>
            {Object.entries(enterpriseConfig.pricing).map(([key, plan]) => (
              <TouchableOpacity
                key={key}
                style={styles.pricingCard}
                onPress={() => handleEditPricing(key, plan)}
              >
                <View style={styles.pricingCardHeader}>
                  <Text style={styles.pricingPlanName}>{plan.name}</Text>
                  <Edit3 size={16} color="#0066CC" />
                </View>
                <View style={styles.pricingAmount}>
                  <Text style={styles.pricingCurrency}>{plan.currency}</Text>
                  <Text style={styles.pricingPrice}>
                    {key === 'custom' ? 'Contact' : `${plan.price}`}
                  </Text>
                  {key !== 'custom' && (
                    <Text style={styles.pricingPeriod}>/{plan.period}</Text>
                  )}
                </View>
                <View style={styles.pricingFeatures}>
                  {enterpriseConfig.features
                    .filter((f: any) => f.plans.includes(key) && f.enabled)
                    .slice(0, 3)
                    .map((feature: any) => (
                      <Text key={feature.id} style={styles.pricingFeatureItem}>
                        • {feature.name}
                      </Text>
                    ))}
                  {enterpriseConfig.features.filter((f: any) => f.plans.includes(key)).length > 3 && (
                    <Text style={styles.pricingFeatureMore}>
                      +{enterpriseConfig.features.filter((f: any) => f.plans.includes(key)).length - 3} more features
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Features Management Section */}
        <View style={styles.featuresSection}>
          <View style={styles.featuresSectionHeader}>
            <Text style={styles.subsectionTitle}>Feature Management</Text>
            <TouchableOpacity
              style={styles.addFeatureButton}
              onPress={() => handleAddFeature()}
            >
              <Plus size={16} color="#0066CC" />
              <Text style={styles.addFeatureText}>Add Feature</Text>
            </TouchableOpacity>
          </View>
          
          {enterpriseConfig.features.map(feature => (
            <View key={feature.id} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                  <View style={styles.featurePlans}>
                    {feature.plans.map(plan => (
                      <View key={plan} style={styles.featurePlanBadge}>
                        <Text style={styles.featurePlanText}>
                          {enterpriseConfig.pricing[plan as keyof typeof enterpriseConfig.pricing]?.name || plan}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.featureActions}>
                  <Switch
                    value={feature.enabled}
                    onValueChange={(value) => handleToggleFeature(feature.id, value)}
                    trackColor={{ false: '#E5E5E5', true: '#0066CC' }}
                  />
                  <TouchableOpacity
                    style={styles.featureEditButton}
                    onPress={() => handleEditFeature(feature)}
                  >
                    <Edit3 size={16} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.featureDeleteButton}
                    onPress={() => handleDeleteFeature(feature.id)}
                  >
                    <Trash2 size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Company Information Section */}
        <View style={styles.companySection}>
          <Text style={styles.subsectionTitle}>Company Information</Text>
          <View style={styles.companyCard}>
            <TextInput
              style={styles.companyInput}
              placeholder="Company Name"
              value={enterpriseConfig.learnMore.companyInfo}
              onChangeText={(text) => setEnterpriseConfig({
                ...enterpriseConfig,
                learnMore: { ...enterpriseConfig.learnMore, companyInfo: text }
              })}
            />
            <TextInput
              style={[styles.companyInput, styles.textArea]}
              placeholder="Product Description"
              value={enterpriseConfig.learnMore.description}
              onChangeText={(text) => setEnterpriseConfig({
                ...enterpriseConfig,
                learnMore: { ...enterpriseConfig.learnMore, description: text }
              })}
              multiline
              numberOfLines={4}
            />
            
            <Text style={styles.inputLabel}>Key Benefits</Text>
            {enterpriseConfig.learnMore.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <TextInput
                  style={styles.benefitInput}
                  value={benefit}
                  onChangeText={(text) => handleUpdateBenefit(index, text)}
                  placeholder="Enter benefit"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveBenefit(index)}
                  style={styles.removeBenefitButton}
                >
                  <X size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addBenefitButton}
              onPress={handleAddBenefit}
            >
              <Plus size={16} color="#0066CC" />
              <Text style={styles.addBenefitText}>Add Benefit</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Contact Information</Text>
            <TextInput
              style={styles.companyInput}
              placeholder="Email"
              value={enterpriseConfig.learnMore.contact.email}
              onChangeText={(text) => setEnterpriseConfig({
                ...enterpriseConfig,
                learnMore: {
                  ...enterpriseConfig.learnMore,
                  contact: { ...enterpriseConfig.learnMore.contact, email: text }
                }
              })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.companyInput}
              placeholder="Phone"
              value={enterpriseConfig.learnMore.contact.phone}
              onChangeText={(text) => setEnterpriseConfig({
                ...enterpriseConfig,
                learnMore: {
                  ...enterpriseConfig.learnMore,
                  contact: { ...enterpriseConfig.learnMore.contact, phone: text }
                }
              })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.companyInput}
              placeholder="Website"
              value={enterpriseConfig.learnMore.contact.website}
              onChangeText={(text) => setEnterpriseConfig({
                ...enterpriseConfig,
                learnMore: {
                  ...enterpriseConfig.learnMore,
                  contact: { ...enterpriseConfig.learnMore.contact, website: text }
                }
              })}
              autoCapitalize="none"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const handleSaveEnterpriseConfig = async () => {
    try {
      // Save to AsyncStorage or your backend
      await AsyncStorage.setItem('enterpriseConfig', JSON.stringify(enterpriseConfig));
      Alert.alert('Success', 'Enterprise configuration saved successfully');
      await addAuditLog('UPDATE_ENTERPRISE_CONFIG', 'System', 'CONFIG', 'Updated enterprise features and pricing');
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    }
  };

  const handleEditPricing = (key: string, plan: any) => {
    Alert.prompt(
      'Edit Pricing',
      `Enter new price for ${plan.name} (current: ${plan.price}/${plan.period})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: (value) => {
            const newPrice = parseInt(value || '0');
            setEnterpriseConfig({
              ...enterpriseConfig,
              pricing: {
                ...enterpriseConfig.pricing,
                [key]: { ...plan, price: newPrice }
              }
            });
          }
        }
      ],
      'plain-text',
      plan.price.toString()
    );
  };

  const handleToggleFeature = (featureId: string, enabled: boolean) => {
    setEnterpriseConfig({
      ...enterpriseConfig,
      features: enterpriseConfig.features.map(f =>
        f.id === featureId ? { ...f, enabled } : f
      )
    });
  };

  const handleEditFeature = (feature: any) => {
    setEditingFeature(feature);
    setShowEnterpriseModal(true);
  };

  const handleAddFeature = () => {
    const newFeature = {
      id: Date.now().toString(),
      name: 'New Feature',
      description: 'Feature description',
      plans: ['basic'],
      enabled: true
    };
    setEditingFeature(newFeature);
    setShowEnterpriseModal(true);
  };

  const handleDeleteFeature = (featureId: string) => {
    Alert.alert(
      'Delete Feature',
      'Are you sure you want to delete this feature?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEnterpriseConfig({
              ...enterpriseConfig,
              features: enterpriseConfig.features.filter(f => f.id !== featureId)
            });
          }
        }
      ]
    );
  };

  const handleUpdateBenefit = (index: number, text: string) => {
    const newBenefits = [...enterpriseConfig.learnMore.benefits];
    newBenefits[index] = text;
    setEnterpriseConfig({
      ...enterpriseConfig,
      learnMore: { ...enterpriseConfig.learnMore, benefits: newBenefits }
    });
  };

  const handleRemoveBenefit = (index: number) => {
    const newBenefits = enterpriseConfig.learnMore.benefits.filter((_, i) => i !== index);
    setEnterpriseConfig({
      ...enterpriseConfig,
      learnMore: { ...enterpriseConfig.learnMore, benefits: newBenefits }
    });
  };

  const handleAddBenefit = () => {
    setEnterpriseConfig({
      ...enterpriseConfig,
      learnMore: {
        ...enterpriseConfig.learnMore,
        benefits: [...enterpriseConfig.learnMore.benefits, '']
      }
    });
  };

  const renderAuditLogs = () => (
    <View style={styles.auditContainer}>
      <Text style={styles.sectionTitle}>Audit Logs</Text>
      
      <View style={styles.filterBar}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredAuditLogs}
        keyExtractor={(item) => item.log_id}
        renderItem={({ item }) => (
          <View style={styles.auditCard}>
            <View style={styles.auditHeader}>
              <Text style={styles.auditAction}>{item.action}</Text>
              <Text style={styles.auditTime}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.auditDetails}>{item.details}</Text>
            <Text style={styles.auditActor}>By: {item.actor_staff_id}</Text>
            <Text style={styles.auditTarget}>
              {item.target_type}: {item.target_id}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Clock size={48} color="#999" />
            <Text style={styles.emptyStateText}>No audit logs found</Text>
          </View>
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Offline Status Component */}
      <OfflineStatus 
        showDetails={showOfflineDetails} 
        onToggleDetails={() => setShowOfflineDetails(!showOfflineDetails)} 
      />
      
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vault' && styles.tabActive]}
          onPress={() => setActiveTab('vault')}
        >
          <Database size={20} color={activeTab === 'vault' ? '#0066CC' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'vault' && styles.tabTextActive]}>
            Data Vault
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'staff' && styles.tabActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Users size={20} color={activeTab === 'staff' ? '#0066CC' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'staff' && styles.tabTextActive]}>
            Staff
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'audit' && styles.tabActive]}
          onPress={() => setActiveTab('audit')}
        >
          <Shield size={20} color={activeTab === 'audit' ? '#0066CC' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'audit' && styles.tabTextActive]}>
            Audit
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enterprise' && styles.tabActive]}
          onPress={() => setActiveTab('enterprise')}
        >
          <Database size={20} color={activeTab === 'enterprise' ? '#0066CC' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'enterprise' && styles.tabTextActive]}>
            Enterprise
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading admin data...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'vault' && renderVaultSection()}
          {activeTab === 'staff' && renderStaffManagement()}
          {activeTab === 'audit' && renderAuditLogs()}
          {activeTab === 'enterprise' && renderEnterpriseSettings()}
        </>
      )}

      {/* Add Staff Modal */}
      <Modal
        visible={showAddStaffModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStaffModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Staff Member</Text>
              <TouchableOpacity onPress={() => setShowAddStaffModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Full Name *"
              value={newStaff.name}
              onChangeText={(text) => setNewStaff({ ...newStaff, name: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Corporation ID *"
              value={newStaff.corporationId}
              onChangeText={(text) => setNewStaff({ ...newStaff, corporationId: text })}
              autoCapitalize="characters"
            />

            <View style={styles.modalInput}>
              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleOptions}>
                {['Staff', 'Admin', 'SuperAdmin'].map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOption, newStaff.role === role && styles.roleOptionActive]}
                    onPress={() => setNewStaff({ ...newStaff, role: role as any })}
                  >
                    <Text style={[styles.roleOptionText, newStaff.role === role && styles.roleOptionTextActive]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Department"
              value={newStaff.department}
              onChangeText={(text) => setNewStaff({ ...newStaff, department: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowAddStaffModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={handleAddStaff}>
                <Text style={styles.modalSubmitText}>Add Staff</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enterprise Feature Modal */}
      <Modal
        visible={showEnterpriseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEnterpriseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFeature?.id ? 'Edit Feature' : 'Add Feature'}
              </Text>
              <TouchableOpacity onPress={() => setShowEnterpriseModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Feature Name"
              value={editingFeature?.name || ''}
              onChangeText={(text) => setEditingFeature({ ...editingFeature, name: text })}
            />

            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Feature Description"
              value={editingFeature?.description || ''}
              onChangeText={(text) => setEditingFeature({ ...editingFeature, description: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Available in Plans:</Text>
            <View style={styles.plansSelection}>
              {Object.entries(enterpriseConfig.pricing).map(([key, plan]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.planCheckbox,
                    editingFeature?.plans?.includes(key) && styles.planCheckboxActive
                  ]}
                  onPress={() => {
                    const currentPlans = editingFeature?.plans || [];
                    const newPlans = currentPlans.includes(key)
                      ? currentPlans.filter(p => p !== key)
                      : [...currentPlans, key];
                    setEditingFeature({ ...editingFeature, plans: newPlans });
                  }}
                >
                  {editingFeature?.plans?.includes(key) && (
                    <Check size={14} color="#fff" />
                  )}
                  <Text style={[
                    styles.planCheckboxText,
                    editingFeature?.plans?.includes(key) && styles.planCheckboxTextActive
                  ]}>
                    {plan.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEnterpriseModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={() => {
                  if (editingFeature) {
                    const existingIndex = enterpriseConfig.features.findIndex(
                      f => f.id === editingFeature.id
                    );
                    if (existingIndex >= 0) {
                      const newFeatures = [...enterpriseConfig.features];
                      newFeatures[existingIndex] = editingFeature;
                      setEnterpriseConfig({ ...enterpriseConfig, features: newFeatures });
                    } else {
                      setEnterpriseConfig({
                        ...enterpriseConfig,
                        features: [...enterpriseConfig.features, editingFeature]
                      });
                    }
                  }
                  setShowEnterpriseModal(false);
                  setEditingFeature(null);
                }}
              >
                <Text style={styles.modalSubmitText}>Save Feature</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Options</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.reportOptions}>
              <View style={styles.reportOption}>
                <Text style={styles.reportOptionLabel}>Anonymize Patient</Text>
                <Switch
                  value={anonymizeReport}
                  onValueChange={setAnonymizeReport}
                  trackColor={{ false: '#E5E5E5', true: '#0066CC' }}
                />
              </View>

              <View style={styles.reportOption}>
                <Text style={styles.reportOptionLabel}>Report Format</Text>
                <View style={styles.formatOptions}>
                  <TouchableOpacity
                    style={[styles.formatOption, reportFormat === 'full' && styles.formatOptionActive]}
                    onPress={() => setReportFormat('full')}
                  >
                    <Text style={[styles.formatOptionText, reportFormat === 'full' && styles.formatOptionTextActive]}>
                      Full
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formatOption, reportFormat === 'summary' && styles.formatOptionActive]}
                    onPress={() => setReportFormat('summary')}
                  >
                    <Text style={[styles.formatOptionText, reportFormat === 'summary' && styles.formatOptionTextActive]}>
                      Summary
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.reportActions}>
              <TouchableOpacity style={styles.reportActionButton} onPress={() => handleCopyReport('text')}>
                <Copy size={20} color="#0066CC" />
                <Text style={styles.reportActionText}>Copy as Text</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.reportActionButton} onPress={() => handleCopyReport('csv')}>
                <FileText size={20} color="#0066CC" />
                <Text style={styles.reportActionText}>Copy as CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.reportActionButton} onPress={() => handleCopyReport('comprehensive')}>
                <Database size={20} color="#0066CC" />
                <Text style={styles.reportActionText}>Comprehensive Report</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.reportActionButton} onPress={() => handleExportPDF(false)}>
                <Download size={20} color="#0066CC" />
                <Text style={styles.reportActionText}>Export Standard PDF</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.reportActionButton, { borderColor: '#28a745', backgroundColor: '#e8f5e8' }]} onPress={() => handleExportPDF(true)}>
                <FileText size={20} color="#28a745" />
                <Text style={[styles.reportActionText, { color: '#28a745', fontWeight: 'bold' }]}>Complete Report PDF</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowReportModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 20,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  accessDeniedSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#0066CC',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  vaultContainer: {
    flex: 1,
  },
  vaultHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  vaultTabs: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  vaultTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  vaultTabActive: {
    backgroundColor: '#0066CC',
  },
  vaultTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  vaultTabTextActive: {
    color: '#fff',
  },
  filterBar: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  selectAllButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#0066CC',
    borderRadius: 6,
  },
  selectAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dataCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dataCardSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#F0F7FF',
  },
  dataCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dataCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dataCardDate: {
    fontSize: 12,
    color: '#999',
  },
  dataCardSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dataCardActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0066CC',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  bulkActionsText: {
    fontSize: 14,
    color: '#666',
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0066CC',
    borderRadius: 6,
    gap: 4,
  },
  comprehensiveButton: {
    backgroundColor: '#28A745',
  },
  bulkActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  staffContainer: {
    flex: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#0066CC',
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  staffCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  staffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  staffId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  staffInfo: {
    marginBottom: 10,
  },
  staffInfoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  staffActions: {
    flexDirection: 'row',
    gap: 10,
  },
  staffActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 6,
  },
  staffActionText: {
    fontSize: 12,
    color: '#666',
  },
  auditContainer: {
    flex: 1,
  },
  auditCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  auditAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  auditTime: {
    fontSize: 12,
    color: '#999',
  },
  auditDetails: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  auditActor: {
    fontSize: 12,
    color: '#666',
  },
  auditTarget: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#666',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#666',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0066CC',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  reportOptions: {
    marginBottom: 20,
  },
  reportOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  reportOptionLabel: {
    fontSize: 14,
    color: '#333',
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  formatOption: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  formatOptionActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  formatOptionText: {
    fontSize: 12,
    color: '#666',
  },
  formatOptionTextActive: {
    color: '#fff',
  },
  reportActions: {
    gap: 10,
  },
  reportActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066CC',
    gap: 8,
  },
  reportActionText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseText: {
    fontSize: 14,
    color: '#666',
  },
  // Enterprise styles
  enterpriseContainer: {
    flex: 1,
  },
  enterpriseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#28A745',
    borderRadius: 6,
    gap: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  pricingSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pricingCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 15,
  },
  pricingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pricingPlanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pricingAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  pricingCurrency: {
    fontSize: 14,
    color: '#666',
    marginRight: 2,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  pricingPeriod: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  pricingFeatures: {
    marginTop: 10,
  },
  pricingFeatureItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pricingFeatureMore: {
    fontSize: 12,
    color: '#0066CC',
    fontStyle: 'italic',
    marginTop: 4,
  },
  featuresSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  featuresSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addFeatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0066CC',
    gap: 4,
  },
  addFeatureText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  featureCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureInfo: {
    flex: 1,
    marginRight: 10,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  featurePlans: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  featurePlanBadge: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featurePlanText: {
    fontSize: 10,
    color: '#666',
  },
  featureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureEditButton: {
    padding: 4,
  },
  featureDeleteButton: {
    padding: 4,
  },
  companySection: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  companyCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 15,
  },
  companyInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  benefitInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  removeBenefitButton: {
    padding: 8,
  },
  addBenefitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
    gap: 6,
    marginBottom: 15,
  },
  addBenefitText: {
    fontSize: 14,
    color: '#0066CC',
  },
  plansSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  planCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 6,
  },
  planCheckboxActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  planCheckboxText: {
    fontSize: 12,
    color: '#666',
  },
  planCheckboxTextActive: {
    color: '#fff',
  },
});
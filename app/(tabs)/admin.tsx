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

type TabType = 'vault' | 'staff' | 'audit' | 'reports';
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
  } = usePCRStore();

  const [activeTab, setActiveTab] = useState<TabType>('vault');
  const [vaultSection, setVaultSection] = useState<VaultSection>('pcrs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPCR, setSelectedPCR] = useState<CompletedPCR | null>(null);
  const [anonymizeReport, setAnonymizeReport] = useState(false);
  const [reportFormat, setReportFormat] = useState<'full' | 'summary'>('full');
  
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

  // Check if user is admin
  const isAdmin = currentSession?.isAdmin || currentSession?.role === 'admin' || currentSession?.role === 'Admin';
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

  const handleCopyReport = async (format: 'text' | 'csv') => {
    if (!selectedPCR) return;

    try {
      let content = '';
      
      if (format === 'text') {
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

  const handleExportPDF = async () => {
    if (!selectedPCR) return;

    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0066CC; }
            h2 { color: #333; margin-top: 20px; }
            .info-row { margin: 5px 0; }
            .vitals-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .vitals-table th, .vitals-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .vitals-table th { background-color: #f2f2f2; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Patient Care Report</h1>
          <div class="info-row"><strong>Case ID:</strong> ${selectedPCR.id}</div>
          <div class="info-row"><strong>Date:</strong> ${new Date(selectedPCR.submittedAt).toLocaleString()}</div>
          
          <h2>Patient Information</h2>
          <div class="info-row"><strong>Name:</strong> ${anonymizeReport ? 'XXXXX' : `${selectedPCR.patientInfo.firstName} ${selectedPCR.patientInfo.lastName}`}</div>
          <div class="info-row"><strong>MRN:</strong> ${anonymizeReport ? 'XXXXX' : selectedPCR.patientInfo.mrn}</div>
          <div class="info-row"><strong>Age:</strong> ${selectedPCR.patientInfo.age} | <strong>Gender:</strong> ${selectedPCR.patientInfo.gender}</div>
          
          <h2>Incident Information</h2>
          <div class="info-row"><strong>Location:</strong> ${selectedPCR.incidentInfo.location}</div>
          <div class="info-row"><strong>Chief Complaint:</strong> ${selectedPCR.incidentInfo.chiefComplaint}</div>
          <div class="info-row"><strong>Assessment:</strong> ${selectedPCR.incidentInfo.assessment}</div>
          
          <h2>Vital Signs</h2>
          <table class="vitals-table">
            <tr>
              <th>Time</th>
              <th>HR</th>
              <th>BP</th>
              <th>RR</th>
              <th>SpO2</th>
              <th>Temp</th>
            </tr>
            ${selectedPCR.vitals.map(v => `
              <tr>
                <td>${v.timestamp}</td>
                <td>${v.heartRate}</td>
                <td>${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}</td>
                <td>${v.respiratoryRate}</td>
                <td>${v.oxygenSaturation}%</td>
                <td>${v.temperature}°C</td>
              </tr>
            `).join('')}
          </table>
          
          <div class="footer">
            <p>Generated by RORK Admin System</p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <p>Submitted by: ${selectedPCR.submittedBy.name} (${selectedPCR.submittedBy.corporationId})</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'PDF generated successfully');
      }
      
      await addAuditLog('EXPORT_PDF', 'PCR', selectedPCR.id, 'Exported report as PDF');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
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
              if (action === 'deactivate') {
                await deactivateStaff(staff.corporationId);
              } else if (action === 'reactivate') {
                await reactivateStaff(staff.corporationId);
              }
              Alert.alert('Success', `Staff member ${action}d successfully`);
              loadStaffMembers();
            } catch (error) {
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
      await updateStaffRole(staff.corporationId, newRole);
      Alert.alert('Success', 'Role updated successfully');
      loadStaffMembers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update role');
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
          keyExtractor={(item: any) => item.id || item.patient_id || item.encounter_id || item.vitals_id || item.ecg_id || item.signature_id || item.attachment_id}
          renderItem={({ item }) => {
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
                      <Copy size={16} color="#0066CC" />
                      <Text style={styles.actionButtonText}>Copy</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setSelectedPCR(pcr);
                        handleExportPDF();
                      }}
                    >
                      <Download size={16} color="#0066CC" />
                      <Text style={styles.actionButtonText}>PDF</Text>
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
            <TouchableOpacity style={styles.bulkActionButton} onPress={() => handleCopyReport('csv')}>
              <Copy size={20} color="#fff" />
              <Text style={styles.bulkActionButtonText}>Export CSV</Text>
            </TouchableOpacity>
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

              <TouchableOpacity style={styles.reportActionButton} onPress={handleExportPDF}>
                <Download size={20} color="#0066CC" />
                <Text style={styles.reportActionText}>Export PDF</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0066CC',
    gap: 6,
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
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#0066CC',
    borderRadius: 6,
    gap: 6,
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
});
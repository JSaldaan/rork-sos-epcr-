import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitPCROffline, updateStaffOffline, performAdminActionOffline } from '@/utils/offlineManager';

export interface PatientInfo {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  phone: string;
  mrn: string;
}

export interface CallTimeInfo {
  timeOfCall: string;
  date: string;
  arrivalOnScene: string;
  atPatientSide: string;
  toDestination: string;
  atDestination: string;
}

export interface TraumaInjury {
  id: string;
  x: number;
  y: number;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  bodyPart: string;
  view: 'front' | 'back';
}

export interface IncidentInfo {
  location: string;
  chiefComplaint: string;
  history: string;
  assessment: string;
  treatmentGiven: string;
  priority: string;
  onArrivalInfo: string;
  provisionalDiagnosis: string;
  additionalNotes: string;
  traumaInjuries?: TraumaInjury[];
}

export interface VitalSigns {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  temperature: string;
  bloodGlucose: string;
  painScale: string;
  timestamp: string;
  ecgCapture?: string;
  ecgCaptureTimestamp?: string;
}

export interface TransportInfo {
  destination: string;
  customDestination: string;
  mode: string;
  unitNumber: string;
  departureTime: string;
  arrivalTime: string;
  mileage: string;
  primaryParamedic: string;
  secondaryParamedic: string;
  driver: string;
  notes: string;
}

export interface SignatureInfo {
  nurseSignature: string;
  nurseCorporationId: string;
  nurseSignaturePaths: string;
  doctorSignature: string;
  doctorCorporationId: string;
  doctorSignaturePaths: string;
  othersSignature: string;
  othersRole: string;
  othersSignaturePaths: string;
}

export interface RefusalInfo {
  patientName: string;
  dateOfRefusal: string;
  timeOfRefusal: string;
  reasonForRefusal: string;
  risksExplained: boolean;
  mentalCapacity: boolean;
  patientSignature: string;
  patientSignaturePaths: string;
  witnessName: string;
  witnessSignature: string;
  witnessSignaturePaths: string;
  paramedicName: string;
  paramedicSignature: string;
  paramedicSignaturePaths: string;
  additionalNotes: string;
}

export interface CompletedPCR {
  id: string;
  submittedAt: string;
  submittedBy: {
    staffId: string;
    corporationId: string;
    name: string;
    role: string;
  };
  callTimeInfo: CallTimeInfo;
  patientInfo: PatientInfo;
  incidentInfo: IncidentInfo;
  vitals: VitalSigns[];
  transportInfo: TransportInfo;
  signatureInfo: SignatureInfo;
  refusalInfo: RefusalInfo;
  status: 'submitted' | 'draft';
}

export interface StaffMember {
  corporationId: string;
  name: string;
  role: 'Staff' | 'Admin' | 'SuperAdmin' | 'paramedic' | 'nurse' | 'doctor' | 'admin' | 'supervisor';
  department: string;
  isActive: boolean;
  lastLogin?: string;
  status?: 'Active' | 'Inactive';
  created_at?: string;
  last_login_at?: string;
}

export interface AuthSession {
  staffId: string;
  corporationId: string;
  name: string;
  role: 'Staff' | 'Admin' | 'SuperAdmin' | 'paramedic' | 'nurse' | 'doctor' | 'admin' | 'supervisor';
  loginTime: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
}

export interface Patient {
  patient_id: string;
  full_name: string;
  dob: string;
  sex: string;
  phone: string;
  address: string;
  mrn: string;
  created_at: string;
  updated_at: string;
}

export interface Encounter {
  encounter_id: string;
  patient_id: string;
  date_time: string;
  location: string;
  chief_complaint: string;
  history_notes: string;
  assessment_notes: string;
  treatments: string;
  medications: string;
  attending_staff_ids: string[];
  disposition: string;
  created_at: string;
  updated_at: string;
  provisional_diagnosis: string;
}

export interface Vitals {
  vitals_id: string;
  encounter_id: string;
  time_logged: string;
  heart_rate: string;
  bp_systolic: string;
  bp_diastolic: string;
  resp_rate: string;
  spo2: string;
  temperature: string;
  gcs: string;
  notes: string;
}

export interface ECG {
  ecg_id: string;
  encounter_id: string;
  captured_at: string;
  rhythm_label: string;
  image_ecg: string;
  notes: string;
}

export interface Signature {
  signature_id: string;
  encounter_id: string;
  signer_role: 'Patient' | 'Guardian' | 'Provider';
  signer_name: string;
  signed_at: string;
  signature_image: string;
}

export interface Attachment {
  attachment_id: string;
  encounter_id: string;
  file: string;
  label: string;
  uploaded_at: string;
}

export interface AuditLog {
  log_id: string;
  actor_staff_id: string;
  action: string;
  target_type: string;
  target_id: string;
  timestamp: string;
  details: string;
}

interface PCRStore {
  callTimeInfo: CallTimeInfo;
  patientInfo: PatientInfo;
  incidentInfo: IncidentInfo;
  vitals: VitalSigns[];
  transportInfo: TransportInfo;
  signatureInfo: SignatureInfo;
  refusalInfo: RefusalInfo;
  completedPCRs: CompletedPCR[];
  isAdmin: boolean;
  currentSession: AuthSession | null;
  staffMembers: StaffMember[];
  isLoggingOut: boolean;
  // Admin data collections
  patients: Patient[];
  encounters: Encounter[];
  allVitals: Vitals[];
  ecgs: ECG[];
  signatures: Signature[];
  attachments: Attachment[];
  auditLogs: AuditLog[];
  updateCallTimeInfo: (info: Partial<CallTimeInfo>) => void;
  updatePatientInfo: (info: Partial<PatientInfo>) => void;
  updateIncidentInfo: (info: Partial<IncidentInfo>) => void;
  addVitalSigns: (vital: VitalSigns) => void;
  updateTransportInfo: (info: Partial<TransportInfo>) => void;
  updateSignatureInfo: (info: Partial<SignatureInfo>) => void;
  updateRefusalInfo: (info: Partial<RefusalInfo>) => void;
  resetPCR: () => Promise<void>;
  submitPCR: () => Promise<void>;
  getMySubmittedPCRs: () => CompletedPCR[];
  loadCompletedPCRs: () => Promise<void>;
  deletePCR: (id: string) => Promise<void>;
  setAdminMode: (isAdmin: boolean) => void;
  adminLogin: (password: string) => boolean;
  staffLogin: (corporationId: string) => Promise<boolean>;
  staffLogout: () => Promise<void>;
  initializeStaffDatabase: () => Promise<void>;
  validateCorporationId: (corporationId: string) => Promise<StaffMember | null>;
  addStaffMember: (staff: Omit<StaffMember, 'lastLogin'>) => Promise<void>;
  updateStaffMember: (corporationId: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaffMember: (corporationId: string) => Promise<void>;
  loadStaffMembers: () => Promise<void>;
  saveCurrentPCRDraft: () => Promise<void>;
  loadCurrentPCRDraft: () => Promise<void>;
  saveVitalsData: () => Promise<void>;
  saveTransportData: () => Promise<void>;
  saveRefusalData: () => Promise<void>;
  addECGCapture: (ecgData: string) => void;
  updateVitalWithECG: (vitalIndex: number, ecgData: string) => void;
  submitReportWithNotification: () => Promise<void>;
  saveTabDataWithNotification: (tabName: string) => Promise<void>;
  // Admin functions
  loadAdminData: () => Promise<void>;
  addAuditLog: (action: string, targetType: string, targetId: string, details: string) => Promise<void>;
  savePatient: (patient: Patient) => Promise<void>;
  saveEncounter: (encounter: Encounter) => Promise<void>;
  saveVitals: (vitals: Vitals) => Promise<void>;
  saveECG: (ecg: ECG) => Promise<void>;
  saveSignature: (signature: Signature) => Promise<void>;
  saveAttachment: (attachment: Attachment) => Promise<void>;
  deletePatient: (patientId: string) => Promise<void>;
  deleteEncounter: (encounterId: string) => Promise<void>;
  updateStaffRole: (corporationId: string, newRole: string) => Promise<void>;
  deactivateStaff: (corporationId: string) => Promise<void>;
  reactivateStaff: (corporationId: string) => Promise<void>;
  storeComprehensiveAdminData: (pcr: CompletedPCR) => Promise<void>;
  generateComprehensiveReport: (pcrId: string) => Promise<string>;
  exportAllData: () => Promise<string>;
}

const initialPatientInfo: PatientInfo = {
  firstName: '',
  lastName: '',
  age: '',
  gender: '',
  phone: '',
  mrn: '',
};

const initialCallTimeInfo: CallTimeInfo = {
  timeOfCall: '',
  date: '',
  arrivalOnScene: '',
  atPatientSide: '',
  toDestination: '',
  atDestination: '',
};

const initialIncidentInfo: IncidentInfo = {
  location: '',
  chiefComplaint: '',
  history: '',
  assessment: '',
  treatmentGiven: '',
  priority: '',
  onArrivalInfo: '',
  provisionalDiagnosis: '',
  additionalNotes: '',
  traumaInjuries: [],
};

const initialTransportInfo: TransportInfo = {
  destination: '',
  customDestination: '',
  mode: '',
  unitNumber: '',
  departureTime: '',
  arrivalTime: '',
  mileage: '',
  primaryParamedic: '',
  secondaryParamedic: '',
  driver: '',
  notes: '',
};

const initialSignatureInfo: SignatureInfo = {
  nurseSignature: '',
  nurseCorporationId: '',
  nurseSignaturePaths: '',
  doctorSignature: '',
  doctorCorporationId: '',
  doctorSignaturePaths: '',
  othersSignature: '',
  othersRole: '',
  othersSignaturePaths: '',
};

const initialRefusalInfo: RefusalInfo = {
  patientName: '',
  dateOfRefusal: '',
  timeOfRefusal: '',
  reasonForRefusal: '',
  risksExplained: false,
  mentalCapacity: false,
  patientSignature: '',
  patientSignaturePaths: '',
  witnessName: '',
  witnessSignature: '',
  witnessSignaturePaths: '',
  paramedicName: '',
  paramedicSignature: '',
  paramedicSignaturePaths: '',
  additionalNotes: '',
};

// Default staff members for demonstration
const defaultStaffMembers: StaffMember[] = [
  {
    corporationId: 'SUPER001',
    name: 'Super Administrator',
    role: 'SuperAdmin',
    department: 'IT',
    isActive: true,
    status: 'Active',
    created_at: new Date().toISOString(),
  },
  {
    corporationId: 'ADMIN001',
    name: 'System Administrator',
    role: 'Admin',
    department: 'IT',
    isActive: true,
    status: 'Active',
    created_at: new Date().toISOString(),
  },
  {
    corporationId: 'PARA001',
    name: 'John Smith',
    role: 'paramedic',
    department: 'Emergency Services',
    isActive: true,
  },
  {
    corporationId: 'PARA002',
    name: 'Sarah Johnson',
    role: 'paramedic',
    department: 'Emergency Services',
    isActive: true,
  },
  {
    corporationId: 'NURSE001',
    name: 'Emily Davis',
    role: 'nurse',
    department: 'Emergency Department',
    isActive: true,
  },
  {
    corporationId: 'DOC001',
    name: 'Dr. Michael Brown',
    role: 'doctor',
    department: 'Emergency Medicine',
    isActive: true,
  },
  {
    corporationId: 'SUP001',
    name: 'Lisa Wilson',
    role: 'supervisor',
    department: 'Operations',
    isActive: true,
  },
];

export const usePCRStore = create<PCRStore>((set, get) => ({
  callTimeInfo: initialCallTimeInfo,
  patientInfo: initialPatientInfo,
  incidentInfo: initialIncidentInfo,
  vitals: [],
  transportInfo: initialTransportInfo,
  signatureInfo: initialSignatureInfo,
  refusalInfo: initialRefusalInfo,
  completedPCRs: [],
  isAdmin: false,
  currentSession: null,
  staffMembers: [],
  isLoggingOut: false,
  // Admin data collections
  patients: [],
  encounters: [],
  allVitals: [],
  ecgs: [],
  signatures: [],
  attachments: [],
  auditLogs: [],
  
  updateCallTimeInfo: (info) => {
    set((state) => ({
      callTimeInfo: { ...state.callTimeInfo, ...info },
    }));
    // Auto-save draft when data changes
    setTimeout(() => {
      get().saveCurrentPCRDraft().catch(console.error);
    }, 500);
  },
  
  updatePatientInfo: (info) => {
    set((state) => ({
      patientInfo: { ...state.patientInfo, ...info },
    }));
    // Auto-save draft when data changes
    setTimeout(() => {
      get().saveCurrentPCRDraft().catch(console.error);
    }, 500);
  },
  
  updateIncidentInfo: (info) => {
    set((state) => ({
      incidentInfo: { ...state.incidentInfo, ...info },
    }));
    // Auto-save draft when data changes
    setTimeout(() => {
      get().saveCurrentPCRDraft().catch(console.error);
    }, 500);
  },
  
  addVitalSigns: (vital) => {
    set((state) => ({
      vitals: [...state.vitals, vital],
    }));
    // Auto-save draft when vitals are added
    setTimeout(() => {
      get().saveCurrentPCRDraft().catch(console.error);
    }, 500);
  },
  
  updateTransportInfo: (info) => {
    set((state) => ({
      transportInfo: { ...state.transportInfo, ...info },
    }));
    // Auto-save draft when data changes
    setTimeout(() => {
      get().saveCurrentPCRDraft().catch(console.error);
    }, 500);
  },
  
  updateSignatureInfo: (info) => {
    set((state) => ({
      signatureInfo: { ...state.signatureInfo, ...info },
    }));
    // Auto-save draft when data changes
    setTimeout(() => {
      get().saveCurrentPCRDraft().catch(console.error);
    }, 500);
  },
  
  updateRefusalInfo: (info) => {
    set((state) => ({
      refusalInfo: { ...state.refusalInfo, ...info },
    }));
  },
  
  resetPCR: async () => {
    set({
      callTimeInfo: initialCallTimeInfo,
      patientInfo: initialPatientInfo,
      incidentInfo: initialIncidentInfo,
      vitals: [],
      transportInfo: initialTransportInfo,
      signatureInfo: initialSignatureInfo,
      refusalInfo: initialRefusalInfo,
    });
    
    // Also clear the draft from storage
    try {
      await AsyncStorage.removeItem('currentPCRDraft');
      console.log('PCR draft cleared on reset');
    } catch (error) {
      console.error('Error clearing draft on reset:', error);
    }
  },

  submitPCR: async () => {
    const state = get();
    const currentSession = state.currentSession;
    
    if (!currentSession) {
      throw new Error('No active session found. Please login first.');
    }
    
    const completedPCR: CompletedPCR = {
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      submittedBy: {
        staffId: currentSession.staffId,
        corporationId: currentSession.corporationId,
        name: currentSession.name,
        role: currentSession.role,
      },
      callTimeInfo: state.callTimeInfo,
      patientInfo: state.patientInfo,
      incidentInfo: state.incidentInfo,
      vitals: state.vitals,
      transportInfo: state.transportInfo,
      signatureInfo: state.signatureInfo,
      refusalInfo: state.refusalInfo,
      status: 'submitted',
    };

    console.log('=== SUBMITTING PCR (OFFLINE CAPABLE) ===');
    console.log('Current session:', currentSession);
    console.log('New PCR:', {
      id: completedPCR.id,
      patient: `${completedPCR.patientInfo.firstName} ${completedPCR.patientInfo.lastName}`,
      submittedAt: completedPCR.submittedAt,
      submittedBy: completedPCR.submittedBy
    });
    
    // Store locally first (immediate)
    let existingPCRs: CompletedPCR[] = [];
    try {
      const stored = await AsyncStorage.getItem('completedPCRs');
      if (stored) {
        existingPCRs = JSON.parse(stored);
        console.log('Existing PCRs loaded:', existingPCRs.length);
      }
    } catch (error) {
      console.error('Error loading existing PCRs:', error);
    }
    
    const updatedPCRs = [...existingPCRs, completedPCR];
    await AsyncStorage.setItem('completedPCRs', JSON.stringify(updatedPCRs));
    
    // Update state immediately
    set({ completedPCRs: updatedPCRs });
    
    // Store comprehensive admin data locally
    await get().storeComprehensiveAdminData(completedPCR);
    
    // Queue for offline sync (will sync when online)
    try {
      const queueId = await submitPCROffline(completedPCR);
      console.log('PCR queued for offline sync:', queueId);
    } catch (error) {
      console.error('Failed to queue PCR for offline sync:', error);
    }
    
    console.log('PCR submitted and saved locally. Total PCRs now:', updatedPCRs.length);
    console.log('All PCRs:', updatedPCRs.map(pcr => ({ 
      id: pcr.id, 
      patient: `${pcr.patientInfo.firstName} ${pcr.patientInfo.lastName}`, 
      submittedBy: pcr.submittedBy.name,
      corporationId: pcr.submittedBy.corporationId
    })));
    console.log('=== END SUBMITTING PCR ===');
    
    // Force a reload to ensure data consistency
    setTimeout(() => {
      get().loadCompletedPCRs();
    }, 100);
  },

  loadCompletedPCRs: async () => {
    try {
      const stored = await AsyncStorage.getItem('completedPCRs');
      console.log('=== LOADING PCRs ===');
      console.log('Raw stored data exists:', !!stored);
      console.log('Raw stored data length:', stored?.length || 0);
      
      if (stored) {
        const pcrs = JSON.parse(stored);
        console.log('Parsed PCRs count:', pcrs.length);
        
        // Migrate old PCRs that don't have submittedBy field
        const migratedPCRs = pcrs.map((pcr: CompletedPCR) => {
          if (!pcr.submittedBy) {
            return {
              ...pcr,
              submittedBy: {
                staffId: 'LEGACY',
                corporationId: 'LEGACY',
                name: 'Legacy User',
                role: 'unknown',
              },
            };
          }
          return pcr;
        });
        
        // Save migrated data back to storage if any migration occurred
        const needsMigration = pcrs.some((pcr: CompletedPCR) => !pcr.submittedBy);
        if (needsMigration) {
          await AsyncStorage.setItem('completedPCRs', JSON.stringify(migratedPCRs));
          console.log('Migrated', pcrs.length, 'PCRs to include submittedBy field');
        }
        
        set({ completedPCRs: migratedPCRs });
        console.log('Loaded', migratedPCRs.length, 'completed PCRs');
        console.log('PCR details:', migratedPCRs.map((pcr: CompletedPCR) => ({ 
          id: pcr.id, 
          patient: `${pcr.patientInfo.firstName} ${pcr.patientInfo.lastName}`, 
          submittedBy: pcr.submittedBy.name,
          submittedAt: pcr.submittedAt
        })));
      } else {
        console.log('No stored PCRs found, initializing empty array');
        set({ completedPCRs: [] });
      }
      console.log('=== END LOADING PCRs ===');
    } catch (error) {
      console.error('Error loading completed PCRs:', error);
      console.error('Error details:', error);
      set({ completedPCRs: [] });
    }
  },

  deletePCR: async (id: string) => {
    const state = get();
    const updatedPCRs = state.completedPCRs.filter(pcr => pcr.id !== id);
    await AsyncStorage.setItem('completedPCRs', JSON.stringify(updatedPCRs));
    set({ completedPCRs: updatedPCRs });
    console.log('PCR deleted:', id);
  },

  setAdminMode: (isAdmin: boolean) => {
    console.log('=== ADMIN MODE CHANGE ===');
    console.log('Admin mode:', isAdmin ? 'enabled' : 'disabled');
    if (!isAdmin) {
      // When logging out, clear everything from state and storage
      AsyncStorage.removeItem('currentSession').catch(console.error);
      AsyncStorage.removeItem('currentPCRDraft').catch(console.error);
      set({ 
        isAdmin: false,
        completedPCRs: [],
        currentSession: null,
        // Reset PCR data to initial values
        callTimeInfo: initialCallTimeInfo,
        patientInfo: initialPatientInfo,
        incidentInfo: initialIncidentInfo,
        vitals: [],
        transportInfo: initialTransportInfo,
        signatureInfo: initialSignatureInfo,
        refusalInfo: initialRefusalInfo,
      });
      console.log('Admin logged out, cleared state and session storage');
    } else {
      set({ isAdmin: true });
      // Load PCRs when logging in
      setTimeout(() => {
        get().loadCompletedPCRs();
      }, 100);
    }
    console.log('=== END ADMIN MODE CHANGE ===');
  },

  adminLogin: (password: string) => {
    // Simple backdoor password - change this to your preferred password
    const adminPassword = 'admin123';
    
    if (password === adminPassword) {
      // Create admin session
      const adminSession: AuthSession = {
        staffId: 'ADMIN_SYSTEM',
        corporationId: 'ADMIN_SYSTEM',
        name: 'System Administrator',
        role: 'SuperAdmin',
        loginTime: new Date().toISOString(),
        isAdmin: true,
        isSuperAdmin: true,
      };
      
      set({ 
        isAdmin: true,
        currentSession: adminSession
      });
      
      // Store admin session
      AsyncStorage.setItem('currentSession', JSON.stringify(adminSession)).catch(console.error);
      
      console.log('Admin login successful, loading data...');
      // Load all data immediately after successful login
      setTimeout(() => {
        get().loadCompletedPCRs();
        get().loadAdminData();
      }, 100);
      return true;
    }
    return false;
  },

  initializeStaffDatabase: async () => {
    try {
      console.log('=== INITIALIZING STAFF DATABASE ===');
      const stored = await AsyncStorage.getItem('staffMembers');
      console.log('Stored staff data exists:', !!stored);
      
      if (!stored) {
        // Initialize with default staff members
        console.log('No stored staff data, creating default members:', defaultStaffMembers.length);
        await AsyncStorage.setItem('staffMembers', JSON.stringify(defaultStaffMembers));
        set({ staffMembers: defaultStaffMembers });
        console.log('Staff database initialized with default members:', defaultStaffMembers.map(s => ({ id: s.corporationId, name: s.name })));
      } else {
        const staffMembers = JSON.parse(stored);
        set({ staffMembers });
        console.log('Staff database loaded:', staffMembers.length, 'members');
        console.log('Loaded staff members:', staffMembers.map((s: StaffMember) => ({ id: s.corporationId, name: s.name, active: s.isActive })));
      }
      console.log('=== END INITIALIZING STAFF DATABASE ===');
    } catch (error) {
      console.error('Error initializing staff database:', error);
      console.log('Falling back to default staff members');
      set({ staffMembers: defaultStaffMembers });
    }
  },



  validateCorporationId: async (corporationId: string): Promise<StaffMember | null> => {
    const state = get();
    const staff = state.staffMembers.find(
      (member) => member.corporationId === corporationId && member.isActive
    );
    return staff || null;
  },

  staffLogin: async (corporationId: string): Promise<boolean> => {
    console.log('=== STAFF LOGIN ATTEMPT ===');
    console.log('Corporation ID:', corporationId);
    
    // Validate Corporation ID format (basic validation)
    if (!corporationId || corporationId.length < 4) {
      console.log('Invalid Corporation ID format');
      return false;
    }
    
    // Ensure staff database is loaded
    await get().loadStaffMembers();
    const currentStaffMembers = get().staffMembers;
    console.log('Available staff members:', currentStaffMembers.map(s => ({ id: s.corporationId, name: s.name, active: s.isActive })));
    
    const staff = await get().validateCorporationId(corporationId);
    console.log('Staff validation result:', staff ? { name: staff.name, role: staff.role, active: staff.isActive } : 'Not found');
    
    if (staff) {
      const session: AuthSession = {
        staffId: staff.corporationId,
        corporationId: staff.corporationId,
        name: staff.name,
        role: staff.role,
        loginTime: new Date().toISOString(),
        isAdmin: staff.role === 'admin' || staff.role === 'Admin' || staff.role === 'SuperAdmin' || staff.role === 'supervisor',
        isSuperAdmin: staff.role === 'SuperAdmin',
      };
      
      // Update last login time
      const updatedStaff = get().staffMembers.map(member => 
        member.corporationId === staff.corporationId 
          ? { ...member, lastLogin: new Date().toISOString() }
          : member
      );
      
      await AsyncStorage.setItem('staffMembers', JSON.stringify(updatedStaff));
      await AsyncStorage.setItem('currentSession', JSON.stringify(session));
      
      set({ 
        currentSession: session,
        isAdmin: session.isAdmin,
        staffMembers: updatedStaff
      });
      
      // Always load completed PCRs after login to ensure data is available
      console.log('Loading completed PCRs after login...');
      await get().loadCompletedPCRs();
      
      console.log('Staff login successful:', {
        name: staff.name,
        role: staff.role,
        isAdmin: session.isAdmin
      });
      console.log('=== END STAFF LOGIN ===');
      return true;
    } else {
      console.log('Corporation ID not found or inactive');
      console.log('Available Corporation IDs:', currentStaffMembers.map(s => s.corporationId));
      console.log('=== END STAFF LOGIN ===');
      return false;
    }
  },

  staffLogout: async () => {
    console.log('=== STAFF LOGOUT ===');
    const state = get();
    
    // Prevent multiple simultaneous logout calls
    if (state.isLoggingOut) {
      console.log('Logout already in progress, skipping');
      return;
    }
    
    set({ isLoggingOut: true });
    
    if (state.currentSession) {
      console.log('Logging out:', state.currentSession.name);
    }
    
    try {
      // Clear all persisted data in parallel for efficiency
      await Promise.all([
        AsyncStorage.removeItem('currentSession'),
        AsyncStorage.removeItem('currentPCRDraft'),
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('refreshToken'),
        AsyncStorage.multiRemove(['userPreferences', 'cachedData']).catch(() => {})
      ]);
      console.log('All persisted data cleared');
      
    } catch (error) {
      console.error('Error during logout cleanup:', error);
    } finally {
      // Reset all state to initial values - this must happen even if cleanup fails
      set({ 
        currentSession: null,
        isAdmin: false,
        completedPCRs: [],
        staffMembers: [],
        isLoggingOut: false,
        // Reset admin data
        patients: [],
        encounters: [],
        allVitals: [],
        ecgs: [],
        signatures: [],
        attachments: [],
        auditLogs: [],
        // Reset PCR data to initial values
        callTimeInfo: initialCallTimeInfo,
        patientInfo: initialPatientInfo,
        incidentInfo: initialIncidentInfo,
        vitals: [],
        transportInfo: initialTransportInfo,
        signatureInfo: initialSignatureInfo,
        refusalInfo: initialRefusalInfo,
      });
      
      console.log('Staff logout complete - all state cleared');
      console.log('Current state after logout:', {
        currentSession: get().currentSession,
        isAdmin: get().isAdmin
      });
      console.log('=== END STAFF LOGOUT ===');
    }
  },

  saveCurrentPCRDraft: async () => {
    const state = get();
    const draftPCR = {
      callTimeInfo: state.callTimeInfo,
      patientInfo: state.patientInfo,
      incidentInfo: state.incidentInfo,
      vitals: state.vitals,
      transportInfo: state.transportInfo,
      signatureInfo: state.signatureInfo,
      refusalInfo: state.refusalInfo,
      lastSaved: new Date().toISOString(),
    };
    
    try {
      await AsyncStorage.setItem('currentPCRDraft', JSON.stringify(draftPCR));
      console.log('PCR draft saved successfully');
    } catch (error) {
      console.error('Error saving PCR draft:', error);
    }
  },

  loadCurrentPCRDraft: async () => {
    try {
      const stored = await AsyncStorage.getItem('currentPCRDraft');
      if (stored) {
        const draft = JSON.parse(stored);
        set({
          callTimeInfo: draft.callTimeInfo || initialCallTimeInfo,
          patientInfo: draft.patientInfo || initialPatientInfo,
          incidentInfo: draft.incidentInfo || initialIncidentInfo,
          vitals: draft.vitals || [],
          transportInfo: draft.transportInfo || initialTransportInfo,
          signatureInfo: draft.signatureInfo || initialSignatureInfo,
          refusalInfo: draft.refusalInfo || initialRefusalInfo,
        });
        console.log('PCR draft loaded successfully from storage');
        console.log('Draft contains:', {
          patient: draft.patientInfo?.firstName ? `${draft.patientInfo.firstName} ${draft.patientInfo.lastName}` : 'No patient',
          vitals: draft.vitals?.length || 0,
          transport: draft.transportInfo?.destination || 'No destination'
        });
      } else {
        console.log('No PCR draft found in storage');
      }
    } catch (error) {
      console.error('Error loading PCR draft:', error);
    }
  },

  saveVitalsData: async () => {
    const state = get();
    console.log('Saving vitals data:', state.vitals.length, 'vital signs');
    try {
      await get().saveCurrentPCRDraft();
      console.log('Vitals data saved successfully');
    } catch (error) {
      console.error('Error saving vitals data:', error);
      throw error;
    }
  },

  saveTransportData: async () => {
    const state = get();
    console.log('Saving transport data:', state.transportInfo);
    try {
      await get().saveCurrentPCRDraft();
      console.log('Transport data saved successfully');
    } catch (error) {
      console.error('Error saving transport data:', error);
      throw error;
    }
  },

  saveRefusalData: async () => {
    const state = get();
    console.log('Saving refusal data:', state.refusalInfo);
    try {
      await get().saveCurrentPCRDraft();
      console.log('Refusal data saved successfully');
    } catch (error) {
      console.error('Error saving refusal data:', error);
      throw error;
    }
  },

  addECGCapture: (ecgData: string) => {
    const state = get();
    if (state.vitals.length > 0) {
      // Add ECG to the most recent vital signs
      const updatedVitals = [...state.vitals];
      const lastVitalIndex = updatedVitals.length - 1;
      updatedVitals[lastVitalIndex] = {
        ...updatedVitals[lastVitalIndex],
        ecgCapture: ecgData,
        ecgCaptureTimestamp: new Date().toISOString(),
      };
      set({ vitals: updatedVitals });
      console.log('ECG capture added to most recent vital signs');
      // Auto-save after ECG capture
      setTimeout(() => {
        get().saveCurrentPCRDraft().catch(console.error);
      }, 500);
    } else {
      console.log('No vital signs available to attach ECG capture');
    }
  },

  updateVitalWithECG: (vitalIndex: number, ecgData: string) => {
    const state = get();
    if (vitalIndex >= 0 && vitalIndex < state.vitals.length) {
      const updatedVitals = [...state.vitals];
      updatedVitals[vitalIndex] = {
        ...updatedVitals[vitalIndex],
        ecgCapture: ecgData,
        ecgCaptureTimestamp: new Date().toISOString(),
      };
      set({ vitals: updatedVitals });
      console.log(`ECG capture added to vital signs at index ${vitalIndex}`);
    }
  },

  getMySubmittedPCRs: () => {
    const state = get();
    const currentSession = state.currentSession;
    
    console.log('=== GET MY SUBMITTED PCRs ===');
    console.log('Current session:', currentSession);
    console.log('Total PCRs in state:', state.completedPCRs.length);
    
    if (!currentSession) {
      console.log('No current session, returning empty array');
      return [];
    }
    
    const myPCRs = state.completedPCRs.filter(pcr => 
      pcr.submittedBy && pcr.submittedBy.corporationId === currentSession.corporationId
    );
    
    console.log('My PCRs found:', myPCRs.length);
    console.log('My PCRs details:', myPCRs.map(pcr => ({
      id: pcr.id,
      patient: `${pcr.patientInfo.firstName} ${pcr.patientInfo.lastName}`,
      submittedBy: pcr.submittedBy.corporationId
    })));
    console.log('=== END GET MY SUBMITTED PCRs ===');
    
    return myPCRs;
  },

  addStaffMember: async (staff: Omit<StaffMember, 'lastLogin'>) => {
    const state = get();
    const newStaff: StaffMember = {
      ...staff,
      lastLogin: undefined,
    };
    
    const updatedStaffMembers = [...state.staffMembers, newStaff];
    await AsyncStorage.setItem('staffMembers', JSON.stringify(updatedStaffMembers));
    set({ staffMembers: updatedStaffMembers });
    console.log('Staff member added:', newStaff.name);
  },

  updateStaffMember: async (corporationId: string, updates: Partial<StaffMember>) => {
    const state = get();
    const updatedStaffMembers = state.staffMembers.map(staff => 
      staff.corporationId === corporationId ? { ...staff, ...updates } : staff
    );
    
    // Update locally first
    await AsyncStorage.setItem('staffMembers', JSON.stringify(updatedStaffMembers));
    set({ staffMembers: updatedStaffMembers });
    
    // Queue for offline sync
    try {
      await updateStaffOffline(corporationId, updates);
      console.log('Staff member updated and queued for sync:', corporationId);
    } catch (error) {
      console.error('Failed to queue staff update for sync:', error);
      console.log('Staff member updated locally only:', corporationId);
    }
  },

  deleteStaffMember: async (corporationId: string) => {
    const state = get();
    const updatedStaffMembers = state.staffMembers.filter(staff => staff.corporationId !== corporationId);
    
    await AsyncStorage.setItem('staffMembers', JSON.stringify(updatedStaffMembers));
    set({ staffMembers: updatedStaffMembers });
    console.log('Staff member deleted:', corporationId);
  },

  loadStaffMembers: async () => {
    try {
      const stored = await AsyncStorage.getItem('staffMembers');
      if (stored) {
        const staffMembers = JSON.parse(stored);
        set({ staffMembers });
        console.log('Staff members loaded:', staffMembers.length, 'members');
      } else {
        // Initialize with default staff members if none exist
        await get().initializeStaffDatabase();
      }
    } catch (error) {
      console.error('Error loading staff members:', error);
      set({ staffMembers: defaultStaffMembers });
    }
  },

  loadAdminData: async () => {
    try {
      const [patients, encounters, vitals, ecgs, signatures, attachments, auditLogs] = await Promise.all([
        AsyncStorage.getItem('admin_patients'),
        AsyncStorage.getItem('admin_encounters'),
        AsyncStorage.getItem('admin_vitals'),
        AsyncStorage.getItem('admin_ecgs'),
        AsyncStorage.getItem('admin_signatures'),
        AsyncStorage.getItem('admin_attachments'),
        AsyncStorage.getItem('admin_auditLogs'),
      ]);

      set({
        patients: patients ? JSON.parse(patients) : [],
        encounters: encounters ? JSON.parse(encounters) : [],
        allVitals: vitals ? JSON.parse(vitals) : [],
        ecgs: ecgs ? JSON.parse(ecgs) : [],
        signatures: signatures ? JSON.parse(signatures) : [],
        attachments: attachments ? JSON.parse(attachments) : [],
        auditLogs: auditLogs ? JSON.parse(auditLogs) : [],
      });
      console.log('Admin data loaded successfully');
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  },

  addAuditLog: async (action: string, targetType: string, targetId: string, details: string) => {
    const state = get();
    const currentSession = state.currentSession;
    if (!currentSession) return;

    const newLog: AuditLog = {
      log_id: Date.now().toString(),
      actor_staff_id: currentSession.staffId,
      action,
      target_type: targetType,
      target_id: targetId,
      timestamp: new Date().toISOString(),
      details,
    };

    const updatedLogs = [...state.auditLogs, newLog];
    await AsyncStorage.setItem('admin_auditLogs', JSON.stringify(updatedLogs));
    set({ auditLogs: updatedLogs });
  },

  savePatient: async (patient: Patient) => {
    const state = get();
    const existingIndex = state.patients.findIndex(p => p.patient_id === patient.patient_id);
    let updatedPatients;
    
    if (existingIndex >= 0) {
      updatedPatients = [...state.patients];
      updatedPatients[existingIndex] = { ...patient, updated_at: new Date().toISOString() };
      await get().addAuditLog('UPDATE_PATIENT', 'Patient', patient.patient_id, `Updated patient: ${patient.full_name}`);
    } else {
      updatedPatients = [...state.patients, { ...patient, created_at: new Date().toISOString() }];
      await get().addAuditLog('CREATE_PATIENT', 'Patient', patient.patient_id, `Created patient: ${patient.full_name}`);
    }
    
    await AsyncStorage.setItem('admin_patients', JSON.stringify(updatedPatients));
    set({ patients: updatedPatients });
  },

  saveEncounter: async (encounter: Encounter) => {
    const state = get();
    const existingIndex = state.encounters.findIndex(e => e.encounter_id === encounter.encounter_id);
    let updatedEncounters;
    
    if (existingIndex >= 0) {
      updatedEncounters = [...state.encounters];
      updatedEncounters[existingIndex] = { ...encounter, updated_at: new Date().toISOString() };
      await get().addAuditLog('UPDATE_ENCOUNTER', 'Encounter', encounter.encounter_id, `Updated encounter`);
    } else {
      updatedEncounters = [...state.encounters, { ...encounter, created_at: new Date().toISOString() }];
      await get().addAuditLog('CREATE_ENCOUNTER', 'Encounter', encounter.encounter_id, `Created encounter`);
    }
    
    await AsyncStorage.setItem('admin_encounters', JSON.stringify(updatedEncounters));
    set({ encounters: updatedEncounters });
  },

  saveVitals: async (vitals: Vitals) => {
    const state = get();
    const updatedVitals = [...state.allVitals, vitals];
    await AsyncStorage.setItem('admin_vitals', JSON.stringify(updatedVitals));
    set({ allVitals: updatedVitals });
    await get().addAuditLog('ADD_VITALS', 'Vitals', vitals.vitals_id, `Added vitals for encounter ${vitals.encounter_id}`);
  },

  saveECG: async (ecg: ECG) => {
    const state = get();
    const updatedECGs = [...state.ecgs, ecg];
    await AsyncStorage.setItem('admin_ecgs', JSON.stringify(updatedECGs));
    set({ ecgs: updatedECGs });
    await get().addAuditLog('ADD_ECG', 'ECG', ecg.ecg_id, `Added ECG for encounter ${ecg.encounter_id}`);
  },

  saveSignature: async (signature: Signature) => {
    const state = get();
    const updatedSignatures = [...state.signatures, signature];
    await AsyncStorage.setItem('admin_signatures', JSON.stringify(updatedSignatures));
    set({ signatures: updatedSignatures });
    await get().addAuditLog('ADD_SIGNATURE', 'Signature', signature.signature_id, `Added ${signature.signer_role} signature`);
  },

  saveAttachment: async (attachment: Attachment) => {
    const state = get();
    const updatedAttachments = [...state.attachments, attachment];
    await AsyncStorage.setItem('admin_attachments', JSON.stringify(updatedAttachments));
    set({ attachments: updatedAttachments });
    await get().addAuditLog('ADD_ATTACHMENT', 'Attachment', attachment.attachment_id, `Added attachment: ${attachment.label}`);
  },

  deletePatient: async (patientId: string) => {
    const state = get();
    const updatedPatients = state.patients.filter(p => p.patient_id !== patientId);
    await AsyncStorage.setItem('admin_patients', JSON.stringify(updatedPatients));
    set({ patients: updatedPatients });
    await get().addAuditLog('DELETE_PATIENT', 'Patient', patientId, `Deleted patient`);
  },

  deleteEncounter: async (encounterId: string) => {
    const state = get();
    const updatedEncounters = state.encounters.filter(e => e.encounter_id !== encounterId);
    await AsyncStorage.setItem('admin_encounters', JSON.stringify(updatedEncounters));
    set({ encounters: updatedEncounters });
    await get().addAuditLog('DELETE_ENCOUNTER', 'Encounter', encounterId, `Deleted encounter`);
  },

  updateStaffRole: async (corporationId: string, newRole: string) => {
    try {
      const state = get();
      const updatedStaffMembers = state.staffMembers.map(staff => 
        staff.corporationId === corporationId ? { ...staff, role: newRole as any } : staff
      );
      
      // Update locally first
      await AsyncStorage.setItem('staffMembers', JSON.stringify(updatedStaffMembers));
      set({ staffMembers: updatedStaffMembers });
      await get().addAuditLog('UPDATE_STAFF_ROLE', 'Staff', corporationId, `Updated role to ${newRole}`);
      
      // Queue for offline sync
      try {
        await performAdminActionOffline('UPDATE_STAFF_ROLE', { corporationId, newRole });
        console.log('Staff role updated and queued for sync:', corporationId, 'to', newRole);
      } catch (error) {
        console.error('Failed to queue staff role update for sync:', error);
        console.log('Staff role updated locally only:', corporationId, 'to', newRole);
      }
    } catch (error) {
      console.error('Error updating staff role:', error);
      throw error;
    }
  },

  deactivateStaff: async (corporationId: string) => {
    try {
      const state = get();
      const updatedStaffMembers = state.staffMembers.map(staff => 
        staff.corporationId === corporationId ? { ...staff, isActive: false, status: 'Inactive' as const } : staff
      );
      
      // Update locally first
      await AsyncStorage.setItem('staffMembers', JSON.stringify(updatedStaffMembers));
      set({ staffMembers: updatedStaffMembers });
      await get().addAuditLog('DEACTIVATE_STAFF', 'Staff', corporationId, `Deactivated staff member`);
      
      // Queue for offline sync
      try {
        await performAdminActionOffline('DEACTIVATE_STAFF', { corporationId });
        console.log('Staff deactivated and queued for sync:', corporationId);
      } catch (error) {
        console.error('Failed to queue staff deactivation for sync:', error);
        console.log('Staff deactivated locally only:', corporationId);
      }
    } catch (error) {
      console.error('Error deactivating staff:', error);
      throw error;
    }
  },

  reactivateStaff: async (corporationId: string) => {
    try {
      const state = get();
      const updatedStaffMembers = state.staffMembers.map(staff => 
        staff.corporationId === corporationId ? { ...staff, isActive: true, status: 'Active' as const } : staff
      );
      
      // Update locally first
      await AsyncStorage.setItem('staffMembers', JSON.stringify(updatedStaffMembers));
      set({ staffMembers: updatedStaffMembers });
      await get().addAuditLog('REACTIVATE_STAFF', 'Staff', corporationId, `Reactivated staff member`);
      
      // Queue for offline sync
      try {
        await performAdminActionOffline('REACTIVATE_STAFF', { corporationId });
        console.log('Staff reactivated and queued for sync:', corporationId);
      } catch (error) {
        console.error('Failed to queue staff reactivation for sync:', error);
        console.log('Staff reactivated locally only:', corporationId);
      }
    } catch (error) {
      console.error('Error reactivating staff:', error);
      throw error;
    }
  },

  storeComprehensiveAdminData: async (pcr: CompletedPCR) => {
    const state = get();
    const encounterId = `ENC_${pcr.id}`;
    const patientId = `PAT_${pcr.id}`;
    
    // Create comprehensive patient record
    const patient: Patient = {
      patient_id: patientId,
      full_name: `${pcr.patientInfo.firstName} ${pcr.patientInfo.lastName}`,
      dob: pcr.patientInfo.age ? new Date(Date.now() - parseInt(pcr.patientInfo.age) * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
      sex: pcr.patientInfo.gender,
      phone: pcr.patientInfo.phone,
      address: pcr.incidentInfo.location,
      mrn: pcr.patientInfo.mrn,
      created_at: pcr.submittedAt,
      updated_at: pcr.submittedAt,
    };
    
    // Create comprehensive encounter record
    const encounter: Encounter = {
      encounter_id: encounterId,
      patient_id: patientId,
      date_time: pcr.callTimeInfo.date && pcr.callTimeInfo.timeOfCall ? 
        `${pcr.callTimeInfo.date}T${pcr.callTimeInfo.timeOfCall}` : pcr.submittedAt,
      location: pcr.incidentInfo.location,
      chief_complaint: pcr.incidentInfo.chiefComplaint,
      history_notes: pcr.incidentInfo.history,
      assessment_notes: pcr.incidentInfo.assessment,
      treatments: pcr.incidentInfo.treatmentGiven,
      medications: '', // Could be extracted from treatment notes
      attending_staff_ids: [pcr.submittedBy.staffId],
      disposition: pcr.incidentInfo.provisionalDiagnosis,
      created_at: pcr.submittedAt,
      updated_at: pcr.submittedAt,
      provisional_diagnosis: pcr.incidentInfo.provisionalDiagnosis,
    };
    
    // Store all vital signs
    const vitalRecords: Vitals[] = pcr.vitals.map((vital, index) => ({
      vitals_id: `VIT_${pcr.id}_${index}`,
      encounter_id: encounterId,
      time_logged: vital.timestamp,
      heart_rate: vital.heartRate,
      bp_systolic: vital.bloodPressureSystolic,
      bp_diastolic: vital.bloodPressureDiastolic,
      resp_rate: vital.respiratoryRate,
      spo2: vital.oxygenSaturation,
      temperature: vital.temperature,
      gcs: vital.bloodGlucose, // Using blood glucose field for GCS
      notes: `Pain Scale: ${vital.painScale}`,
    }));
    
    // Consolidate all ECG captures into a single record
    const allECGCaptures = pcr.vitals.filter(vital => vital.ecgCapture);
    const ecgRecords: ECG[] = allECGCaptures.length > 0 ? [{
      ecg_id: `ECG_${pcr.id}_CONSOLIDATED`,
      encounter_id: encounterId,
      captured_at: allECGCaptures[0].ecgCaptureTimestamp || allECGCaptures[0].timestamp,
      rhythm_label: 'Consolidated ECG Report',
      image_ecg: JSON.stringify(allECGCaptures.map(v => ({
        timestamp: v.ecgCaptureTimestamp || v.timestamp,
        image: v.ecgCapture,
        vitalTimestamp: v.timestamp
      }))),
      notes: `Consolidated ${allECGCaptures.length} ECG capture(s) from vital signs`,
    }] : [];
    
    // Store signatures
    const signatureRecords: Signature[] = [];
    if (pcr.signatureInfo.nurseSignaturePaths) {
      signatureRecords.push({
        signature_id: `SIG_${pcr.id}_NURSE`,
        encounter_id: encounterId,
        signer_role: 'Provider',
        signer_name: pcr.signatureInfo.nurseSignature,
        signed_at: pcr.submittedAt,
        signature_image: pcr.signatureInfo.nurseSignaturePaths,
      });
    }
    if (pcr.signatureInfo.doctorSignaturePaths) {
      signatureRecords.push({
        signature_id: `SIG_${pcr.id}_DOCTOR`,
        encounter_id: encounterId,
        signer_role: 'Provider',
        signer_name: pcr.signatureInfo.doctorSignature,
        signed_at: pcr.submittedAt,
        signature_image: pcr.signatureInfo.doctorSignaturePaths,
      });
    }
    if (pcr.signatureInfo.othersSignaturePaths) {
      signatureRecords.push({
        signature_id: `SIG_${pcr.id}_OTHER`,
        encounter_id: encounterId,
        signer_role: pcr.signatureInfo.othersRole === 'Family Member' ? 'Guardian' : 'Patient',
        signer_name: pcr.signatureInfo.othersSignature,
        signed_at: pcr.submittedAt,
        signature_image: pcr.signatureInfo.othersSignaturePaths,
      });
    }
    
    // Store refusal information as attachment if present
    const attachmentRecords: Attachment[] = [];
    if (pcr.refusalInfo.patientName) {
      attachmentRecords.push({
        attachment_id: `ATT_${pcr.id}_REFUSAL`,
        encounter_id: encounterId,
        file: JSON.stringify(pcr.refusalInfo),
        label: 'Treatment Refusal Documentation',
        uploaded_at: pcr.submittedAt,
      });
    }
    
    // Store transport information as attachment
    attachmentRecords.push({
      attachment_id: `ATT_${pcr.id}_TRANSPORT`,
      encounter_id: encounterId,
      file: JSON.stringify(pcr.transportInfo),
      label: 'Transport Information',
      uploaded_at: pcr.submittedAt,
    });
    
    // Store trauma body diagram as attachment if present
    if (pcr.incidentInfo.traumaInjuries && pcr.incidentInfo.traumaInjuries.length > 0) {
      attachmentRecords.push({
        attachment_id: `ATT_${pcr.id}_TRAUMA`,
        encounter_id: encounterId,
        file: JSON.stringify({
          injuries: pcr.incidentInfo.traumaInjuries,
          provisionalDiagnosis: pcr.incidentInfo.provisionalDiagnosis,
          assessment: pcr.incidentInfo.assessment
        }),
        label: 'Trauma Body Diagram and Injury Details',
        uploaded_at: pcr.submittedAt,
      });
    }
    
    // Store call time information as attachment
    attachmentRecords.push({
      attachment_id: `ATT_${pcr.id}_CALLTIME`,
      encounter_id: encounterId,
      file: JSON.stringify(pcr.callTimeInfo),
      label: 'Call Time Information',
      uploaded_at: pcr.submittedAt,
    });
    
    // Save all data to admin collections
    await get().savePatient(patient);
    await get().saveEncounter(encounter);
    
    for (const vital of vitalRecords) {
      await get().saveVitals(vital);
    }
    
    for (const ecg of ecgRecords) {
      await get().saveECG(ecg);
    }
    
    for (const signature of signatureRecords) {
      await get().saveSignature(signature);
    }
    
    for (const attachment of attachmentRecords) {
      await get().saveAttachment(attachment);
    }
    
    // Log the comprehensive data storage
    await get().addAuditLog('STORE_COMPREHENSIVE_DATA', 'PCR', pcr.id, 
      `Stored comprehensive admin data: Patient, Encounter, ${vitalRecords.length} Vitals, ${ecgRecords.length} ECGs, ${signatureRecords.length} Signatures, ${attachmentRecords.length} Attachments`);
  },

  generateComprehensiveReport: async (pcrId: string): Promise<string> => {
    const state = get();
    const pcr = state.completedPCRs.find(p => p.id === pcrId);
    if (!pcr) return '';
    
    const encounterId = `ENC_${pcrId}`;
    const patientId = `PAT_${pcrId}`;
    
    // Get all related data
    const patient = state.patients.find(p => p.patient_id === patientId);
    const encounter = state.encounters.find(e => e.encounter_id === encounterId);
    const vitals = state.allVitals.filter(v => v.encounter_id === encounterId);
    const ecgs = state.ecgs.filter(e => e.encounter_id === encounterId);
    const signatures = state.signatures.filter(s => s.encounter_id === encounterId);
    const attachments = state.attachments.filter(a => a.encounter_id === encounterId);
    
    let report = `[COMPREHENSIVE CASE REPORT]\n`;
    report += `Case ID: ${pcrId}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Report Type: Complete Administrative Export\n\n`;
    
    // Patient Information
    report += `[PATIENT INFORMATION]\n`;
    if (patient) {
      report += `Patient ID: ${patient.patient_id}\n`;
      report += `Name: ${patient.full_name}\n`;
      report += `DOB: ${patient.dob}\n`;
      report += `Sex: ${patient.sex}\n`;
      report += `Phone: ${patient.phone}\n`;
      report += `Address: ${patient.address}\n`;
      report += `MRN: ${patient.mrn}\n`;
    } else {
      report += `Name: ${pcr.patientInfo.firstName} ${pcr.patientInfo.lastName}\n`;
      report += `Age: ${pcr.patientInfo.age}\n`;
      report += `Gender: ${pcr.patientInfo.gender}\n`;
      report += `Phone: ${pcr.patientInfo.phone}\n`;
      report += `MRN: ${pcr.patientInfo.mrn}\n`;
    }
    report += `\n`;
    
    // Call Time Information
    report += `[CALL TIME INFORMATION]\n`;
    report += `Date: ${pcr.callTimeInfo.date}\n`;
    report += `Time of Call: ${pcr.callTimeInfo.timeOfCall}\n`;
    report += `Arrival on Scene: ${pcr.callTimeInfo.arrivalOnScene}\n`;
    report += `At Patient Side: ${pcr.callTimeInfo.atPatientSide}\n`;
    report += `To Destination: ${pcr.callTimeInfo.toDestination}\n`;
    report += `At Destination: ${pcr.callTimeInfo.atDestination}\n\n`;
    
    // Encounter Information
    report += `[ENCOUNTER INFORMATION]\n`;
    if (encounter) {
      report += `Encounter ID: ${encounter.encounter_id}\n`;
      report += `Date/Time: ${encounter.date_time}\n`;
      report += `Location: ${encounter.location}\n`;
      report += `Chief Complaint: ${encounter.chief_complaint}\n`;
      report += `History: ${encounter.history_notes}\n`;
      report += `Assessment: ${encounter.assessment_notes}\n`;
      report += `Treatments: ${encounter.treatments}\n`;
      report += `Disposition: ${encounter.disposition}\n`;
      report += `Provisional Diagnosis: ${encounter.provisional_diagnosis}\n`;
    } else {
      report += `Location: ${pcr.incidentInfo.location}\n`;
      report += `On Arrival Info: ${pcr.incidentInfo.onArrivalInfo}\n`;
      report += `Chief Complaint: ${pcr.incidentInfo.chiefComplaint}\n`;
      report += `History: ${pcr.incidentInfo.history}\n`;
      report += `Assessment: ${pcr.incidentInfo.assessment}\n`;
      report += `Treatment Given: ${pcr.incidentInfo.treatmentGiven}\n`;
      report += `Priority: ${pcr.incidentInfo.priority}\n`;
      report += `Provisional Diagnosis: ${pcr.incidentInfo.provisionalDiagnosis}\n`;
      report += `Additional Notes: ${pcr.incidentInfo.additionalNotes}\n`;
    }
    report += `\n`;
    
    // Vital Signs
    report += `[VITAL SIGNS TIMELINE]\n`;
    if (vitals.length > 0) {
      vitals.forEach((vital, index) => {
        report += `${index + 1}. Time: ${vital.time_logged}\n`;
        report += `   HR: ${vital.heart_rate} | BP: ${vital.bp_systolic}/${vital.bp_diastolic}\n`;
        report += `   RR: ${vital.resp_rate} | SpO2: ${vital.spo2}%\n`;
        report += `   Temp: ${vital.temperature}°C | GCS: ${vital.gcs}\n`;
        report += `   Notes: ${vital.notes}\n`;
      });
    } else {
      pcr.vitals.forEach((vital, index) => {
        report += `${index + 1}. Time: ${vital.timestamp}\n`;
        report += `   HR: ${vital.heartRate} | BP: ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}\n`;
        report += `   RR: ${vital.respiratoryRate} | SpO2: ${vital.oxygenSaturation}%\n`;
        report += `   Temp: ${vital.temperature}°C | Pain: ${vital.painScale}/10\n`;
        if (vital.ecgCapture) {
          report += `   ECG: Captured at ${vital.ecgCaptureTimestamp}\n`;
        }
      });
    }
    report += `\n`;
    
    // ECG Information (Consolidated)
    report += `[ECG RECORDINGS]\n`;
    const consolidatedECG = ecgs.find(e => e.ecg_id.includes('CONSOLIDATED'));
    if (consolidatedECG) {
      try {
        const ecgData = JSON.parse(consolidatedECG.image_ecg);
        report += `Consolidated ECG Report - ${ecgData.length} capture(s)\n`;
        report += `First Capture: ${consolidatedECG.captured_at}\n`;
        report += `Notes: ${consolidatedECG.notes}\n`;
        report += `All captures preserved in single file for printing\n`;
      } catch {
        report += `ECG Data Available - ${consolidatedECG.notes}\n`;
      }
    } else {
      const ecgVitals = pcr.vitals.filter(v => v.ecgCapture);
      if (ecgVitals.length > 0) {
        report += `${ecgVitals.length} ECG capture(s) from vital signs\n`;
        ecgVitals.forEach((vital, index) => {
          report += `${index + 1}. Captured: ${vital.ecgCaptureTimestamp || vital.timestamp}\n`;
        });
      } else {
        report += `No ECG recordings captured\n`;
      }
    }
    report += `\n`;
    
    // Trauma Body Diagram Information
    if (pcr.incidentInfo.traumaInjuries && pcr.incidentInfo.traumaInjuries.length > 0) {
      report += `[TRAUMA BODY DIAGRAM]\n`;
      report += `Total Injuries Marked: ${pcr.incidentInfo.traumaInjuries.length}\n`;
      pcr.incidentInfo.traumaInjuries.forEach((injury, index) => {
        report += `${index + 1}. ${injury.bodyPart} (${injury.view === 'front' ? 'Anterior' : 'Posterior'})\n`;
        report += `   Severity: ${injury.severity.toUpperCase()}\n`;
        report += `   Description: ${injury.description}\n`;
      });
      report += `\n`;
    }
    
    // Transport Information
    report += `[TRANSPORT INFORMATION]\n`;
    const finalDestination = pcr.transportInfo.destination === "Other" && pcr.transportInfo.customDestination 
      ? pcr.transportInfo.customDestination 
      : pcr.transportInfo.destination;
    report += `Destination: ${finalDestination}\n`;
    report += `Mode: ${pcr.transportInfo.mode}\n`;
    report += `Unit Number: ${pcr.transportInfo.unitNumber}\n`;
    report += `Departure Time: ${pcr.transportInfo.departureTime}\n`;
    report += `Arrival Time: ${pcr.transportInfo.arrivalTime}\n`;
    report += `Mileage: ${pcr.transportInfo.mileage}\n`;
    report += `Primary Paramedic: ${pcr.transportInfo.primaryParamedic}\n`;
    report += `Secondary Paramedic: ${pcr.transportInfo.secondaryParamedic}\n`;
    report += `Driver: ${pcr.transportInfo.driver}\n`;
    report += `Notes: ${pcr.transportInfo.notes}\n\n`;
    
    // Signatures
    report += `[SIGNATURES]\n`;
    if (signatures.length > 0) {
      signatures.forEach((sig, index) => {
        report += `${index + 1}. ${sig.signer_role}: ${sig.signer_name}\n`;
        report += `   Signed at: ${sig.signed_at}\n`;
        report += `   Signature Reference: ${sig.signature_image}\n`;
      });
    } else {
      if (pcr.signatureInfo.nurseSignaturePaths) {
        report += `• Nurse: ${pcr.signatureInfo.nurseSignature} (${pcr.signatureInfo.nurseCorporationId})\n`;
        report += `  Signature Reference: ${pcr.signatureInfo.nurseSignaturePaths}\n`;
      }
      if (pcr.signatureInfo.doctorSignaturePaths) {
        report += `• Doctor: ${pcr.signatureInfo.doctorSignature} (${pcr.signatureInfo.doctorCorporationId})\n`;
        report += `  Signature Reference: ${pcr.signatureInfo.doctorSignaturePaths}\n`;
      }
      if (pcr.signatureInfo.othersSignaturePaths) {
        report += `• ${pcr.signatureInfo.othersRole}: ${pcr.signatureInfo.othersSignature}\n`;
        report += `  Signature Reference: ${pcr.signatureInfo.othersSignaturePaths}\n`;
      }
    }
    report += `\n`;
    
    // Refusal Information (if applicable)
    if (pcr.refusalInfo.patientName) {
      report += `[REFUSAL INFORMATION]\n`;
      report += `Patient Name: ${pcr.refusalInfo.patientName}\n`;
      report += `Date of Refusal: ${pcr.refusalInfo.dateOfRefusal}\n`;
      report += `Time of Refusal: ${pcr.refusalInfo.timeOfRefusal}\n`;
      report += `Reason: ${pcr.refusalInfo.reasonForRefusal}\n`;
      report += `Risks Explained: ${pcr.refusalInfo.risksExplained ? 'Yes' : 'No'}\n`;
      report += `Mental Capacity: ${pcr.refusalInfo.mentalCapacity ? 'Yes' : 'No'}\n`;
      report += `Witness: ${pcr.refusalInfo.witnessName}\n`;
      report += `Paramedic: ${pcr.refusalInfo.paramedicName}\n`;
      report += `Additional Notes: ${pcr.refusalInfo.additionalNotes}\n\n`;
    }
    
    // Staff Information
    report += `[STAFF INFORMATION]\n`;
    report += `Submitted by: ${pcr.submittedBy.name}\n`;
    report += `Corporation ID: ${pcr.submittedBy.corporationId}\n`;
    report += `Role: ${pcr.submittedBy.role}\n`;
    report += `Submission Time: ${pcr.submittedAt}\n\n`;
    
    // Attachments
    report += `[ATTACHMENTS]\n`;
    if (attachments.length > 0) {
      attachments.forEach((att, index) => {
        report += `${index + 1}. ${att.label}\n`;
        report += `   Uploaded: ${att.uploaded_at}\n`;
        report += `   File Reference: ${att.attachment_id}\n`;
      });
    } else {
      report += `No additional attachments\n`;
    }
    report += `\n`;
    
    // System Footer
    report += `[SYSTEM INFORMATION]\n`;
    report += `Generated by: RORK Admin System\n`;
    report += `Generation Time: ${new Date().toLocaleString()}\n`;
    report += `Report ID: ${Date.now()}\n`;
    report += `Data Integrity: All available data included\n`;
    
    return report;
  },

  exportAllData: async (): Promise<string> => {
    const state = get();
    
    let exportData = `[COMPLETE SYSTEM DATA EXPORT]\n`;
    exportData += `Export Date: ${new Date().toLocaleString()}\n`;
    exportData += `System: RORK Patient Care Reporting\n\n`;
    
    // Summary Statistics
    exportData += `[SUMMARY STATISTICS]\n`;
    exportData += `Total PCRs: ${state.completedPCRs.length}\n`;
    exportData += `Total Patients: ${state.patients.length}\n`;
    exportData += `Total Encounters: ${state.encounters.length}\n`;
    exportData += `Total Vital Records: ${state.allVitals.length}\n`;
    exportData += `Total ECG Records: ${state.ecgs.length}\n`;
    exportData += `Total Signatures: ${state.signatures.length}\n`;
    exportData += `Total Attachments: ${state.attachments.length}\n`;
    exportData += `Total Staff Members: ${state.staffMembers.length}\n`;
    exportData += `Total Audit Logs: ${state.auditLogs.length}\n\n`;
    
    // All PCRs with comprehensive data
    exportData += `[ALL PATIENT CARE REPORTS]\n`;
    for (const pcr of state.completedPCRs) {
      const comprehensiveReport = await get().generateComprehensiveReport(pcr.id);
      exportData += comprehensiveReport + '\n' + '='.repeat(80) + '\n\n';
    }
    
    // Staff Directory
    exportData += `[STAFF DIRECTORY]\n`;
    state.staffMembers.forEach((staff, index) => {
      exportData += `${index + 1}. ${staff.name}\n`;
      exportData += `   Corporation ID: ${staff.corporationId}\n`;
      exportData += `   Role: ${staff.role}\n`;
      exportData += `   Department: ${staff.department}\n`;
      exportData += `   Status: ${staff.isActive ? 'Active' : 'Inactive'}\n`;
      exportData += `   Last Login: ${staff.lastLogin || 'Never'}\n`;
      exportData += `   Created: ${staff.created_at || 'Unknown'}\n\n`;
    });
    
    // Audit Trail
    exportData += `[AUDIT TRAIL]\n`;
    state.auditLogs.forEach((log, index) => {
      exportData += `${index + 1}. ${log.timestamp} - ${log.action}\n`;
      exportData += `   Actor: ${log.actor_staff_id}\n`;
      exportData += `   Target: ${log.target_type} (${log.target_id})\n`;
      exportData += `   Details: ${log.details}\n\n`;
    });
    
    exportData += `[END OF EXPORT]\n`;
    exportData += `Export completed at: ${new Date().toLocaleString()}\n`;
    
    return exportData;
  },

  submitReportWithNotification: async () => {
    try {
      await get().submitPCR();
      console.log('PCR submitted successfully with notification');
      return Promise.resolve();
    } catch (error) {
      console.error('Error submitting PCR:', error);
      throw error;
    }
  },

  saveTabDataWithNotification: async (tabName: string) => {
    try {
      await get().saveCurrentPCRDraft();
      console.log(`${tabName} data saved successfully with notification`);
      return Promise.resolve();
    } catch (error) {
      console.error(`Error saving ${tabName} data:`, error);
      throw error;
    }
  },

}));


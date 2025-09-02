import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface IncidentInfo {
  location: string;
  chiefComplaint: string;
  history: string;
  assessment: string;
  treatmentGiven: string;
  priority: string;
  onArrivalInfo: string;
  provisionalDiagnosis: string;
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
  role: 'paramedic' | 'nurse' | 'doctor' | 'admin' | 'supervisor';
  department: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface AuthSession {
  staffId: string;
  corporationId: string;
  name: string;
  role: 'paramedic' | 'nurse' | 'doctor' | 'admin' | 'supervisor';
  loginTime: string;
  isAdmin: boolean;
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
};

const initialTransportInfo: TransportInfo = {
  destination: '',
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
    corporationId: 'ADMIN001',
    name: 'System Administrator',
    role: 'admin',
    department: 'IT',
    isActive: true,
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

    console.log('=== SUBMITTING PCR ===');
    console.log('Current session:', currentSession);
    console.log('New PCR:', {
      id: completedPCR.id,
      patient: `${completedPCR.patientInfo.firstName} ${completedPCR.patientInfo.lastName}`,
      submittedAt: completedPCR.submittedAt,
      submittedBy: completedPCR.submittedBy
    });
    
    // Load existing PCRs first to ensure we don't overwrite
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
    
    console.log('PCR submitted and saved. Total PCRs now:', updatedPCRs.length);
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
      set({ 
        isAdmin: false,
        completedPCRs: [],
        currentSession: null
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
      set({ isAdmin: true });
      console.log('Admin login successful, loading PCRs...');
      // Load PCRs immediately after successful login
      setTimeout(() => {
        get().loadCompletedPCRs();
      }, 100);
      return true;
    }
    return false;
  },

  initializeStaffDatabase: async () => {
    try {
      const stored = await AsyncStorage.getItem('staffMembers');
      if (!stored) {
        // Initialize with default staff members
        await AsyncStorage.setItem('staffMembers', JSON.stringify(defaultStaffMembers));
        set({ staffMembers: defaultStaffMembers });
        console.log('Staff database initialized with default members');
      } else {
        const staffMembers = JSON.parse(stored);
        set({ staffMembers });
        console.log('Staff database loaded:', staffMembers.length, 'members');
      }
    } catch (error) {
      console.error('Error initializing staff database:', error);
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
    
    const staff = await get().validateCorporationId(corporationId);
    
    if (staff) {
      const session: AuthSession = {
        staffId: staff.corporationId,
        corporationId: staff.corporationId,
        name: staff.name,
        role: staff.role,
        loginTime: new Date().toISOString(),
        isAdmin: staff.role === 'admin' || staff.role === 'supervisor',
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
      console.log('=== END STAFF LOGIN ===');
      return false;
    }
  },

  staffLogout: async () => {
    console.log('=== STAFF LOGOUT ===');
    const state = get();
    if (state.currentSession) {
      console.log('Logging out:', state.currentSession.name);
    }
    
    try {
      // Clear session from AsyncStorage
      await AsyncStorage.removeItem('currentSession');
      console.log('Session removed from AsyncStorage');
      
      // Also clear any draft data on logout
      await AsyncStorage.removeItem('currentPCRDraft');
      console.log('Draft data cleared');
    } catch (error) {
      console.error('Error removing data from storage:', error);
    }
    
    // Reset all state to initial values
    set({ 
      currentSession: null,
      isAdmin: false,
      completedPCRs: [],
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
    console.log('=== END STAFF LOGOUT ===');
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
    
    await AsyncStorage.setItem('staffMembers', JSON.stringify(updatedStaffMembers));
    set({ staffMembers: updatedStaffMembers });
    console.log('Staff member updated:', corporationId);
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

}));


// Shared types for PCR Store to avoid circular dependencies

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

export enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST'
}

export enum Specialty {
  // Medicina General y Familiar
  GENERAL = 'Medicina General / Familiar',
  INTERNAL_MEDICINE = 'Medicina Interna',
  GERIATRICS = 'Geriatría',
  
  // Especialidades Clínicas
  PEDIATRICS = 'Pediatría',
  CARDIOLOGY = 'Cardiología',
  DERMATOLOGY = 'Dermatología',
  ENDOCRINOLOGY = 'Endocrinología',
  GASTROENTEROLOGY = 'Gastroenterología',
  HEMATOLOGY = 'Hematología',
  INFECTIOUS_DISEASE = 'Infectología',
  NEPHROLOGY = 'Nefrología',
  NEUROLOGY = 'Neurología',
  ONCOLOGY = 'Oncología',
  PULMONOLOGY = 'Neumología',
  PSYCHIATRY = 'Psiquiatría',
  RHEUMATOLOGY = 'Reumatología',
  ALLERGY_IMMUNOLOGY = 'Alergología e Inmunología',
  GENETICS = 'Genética Médica',
  
  // Especialidades Quirúrgicas
  SURGERY_GENERAL = 'Cirugía General',
  ANESTHESIOLOGY = 'Anestesiología',
  CARDIOVASCULAR_SURGERY = 'Cirugía Cardiovascular',
  NEUROSURGERY = 'Neurocirugía',
  GYNECOLOGY_OBSTETRICS = 'Ginecología y Obstetricia',
  OPHTHALMOLOGY = 'Oftalmología',
  ORTHOPEDICS = 'Ortopedia y Traumatología',
  OTORHINOLARYNGOLOGY = 'Otorrinolaringología (ORL)',
  PLASTIC_SURGERY = 'Cirugía Plástica y Reconstructiva',
  UROLOGY = 'Urología',
  
  // Urgencias y Cuidados Críticos
  EMERGENCY = 'Urgencias / Emergencias',
  INTENSIVE_CARE = 'Medicina Crítica / Terapia Intensiva',
  
  // Diagnóstico y Apoyo
  RADIOLOGY = 'Radiología e Imagen',
  PATHOLOGY = 'Patología',
  NUCLEAR_MEDICINE = 'Medicina Nuclear',
  
  // Otras Profesiones de Salud
  NURSING = 'Enfermería General',
  NURSING_INTENSIVE = 'Enfermería de Cuidados Intensivos',
  NURSING_PEDIATRIC = 'Enfermería Pediátrica',
  NURSING_SURGICAL = 'Enfermería Quirúrgica',
  NUTRITION = 'Nutrición Clínica',
  PSYCHOLOGY = 'Psicología Clínica',
  PHYSIOTHERAPY = 'Fisioterapia / Rehabilitación',
  DENTISTRY = 'Odontología',
  SOCIAL_WORK = 'Trabajo Social'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  specialty?: Specialty;
  avatar?: string;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface Note {
  id: string;
  date: string;
  authorId: string;
  authorName: string;
  role: Role; 
  content: string;
  type: 'EVOLUTION' | 'CONSULTATION' | 'EMERGENCY' | 'NURSING' | 'ADMISSION' | 'DISCHARGE';
  signed: boolean; // Firma digital
  signatureHash?: string;
}

export interface VitalSigns {
  date: string;
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  temp: number;
  weight: number; // kg
  height: number; // cm
  oxygenSat: number;
  respiratoryRate?: number;
  glucose?: number;
  recordedBy?: string;
}

export interface Vaccine {
  id: string;
  name: string;
  dateApplied?: string;
  status: 'PENDING' | 'APPLIED' | 'OVERDUE';
  notes?: string;
}

export interface Procedure {
  id: string;
  name: string;
  date: string;
  performedBy: string;
  notes: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
}

export interface Document {
  id: string;
  name: string;
  type: 'LAB' | 'IMAGING' | 'PRESCRIPTION' | 'CONSENT' | 'OTHER';
  date: string;
  authorName: string;
  url?: string;
}

export interface Consent {
  id: string;
  title: string;
  date: string;
  signedBy: string; 
  witnessName: string;
  type: 'PROCEDURE' | 'ADMISSION' | 'DATA_PRIVACY';
  isSigned: boolean;
}

export interface Admission {
  id: string;
  isActive: boolean;
  dateIn: string;
  dateOut?: string;
  roomNumber?: string;
  diagnosis?: string;
  attendingDoctorId?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  dob: string; // ISO date
  gender: 'M' | 'F' | 'O';
  bloodType?: string;
  identificationNumber?: string; // DNI/Cedula
  allergies: string[];
  conditions: string[];
  contactPhone: string;
  email?: string;
  address?: string;
  
  // Clinical Data
  notes: Note[];
  vitals: VitalSigns[];
  documents: Document[];
  consents: Consent[];
  currentAdmission?: Admission; 
  
  // Módulos Avanzados (Parte 6)
  vaccines: Vaccine[];
  procedures: Procedure[];
  
  assignedDoctorId?: string;
  status: 'ACTIVE' | 'HOSPITALIZED' | 'DISCHARGED' | 'DECEASED';
  
  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  date: string; 
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason: string;
  type: 'CONSULTATION' | 'PROCEDURE' | 'FOLLOWUP';
}

// Configuración de Personalización
export interface AppSettings {
  centerName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
}

export interface AppState {
  currentUser: User | null;
  patients: Patient[];
  appointments: Appointment[];
  logs: AuditLog[];
  settings: AppSettings;
  view: 'LOGIN' | 'DASHBOARD' | 'PATIENTS' | 'CALENDAR' | 'SETTINGS' | 'PATIENT_DETAIL' | 'CHAT';
  activePatientId: string | null;
  modals: {
    newPatient: boolean;
    calculator: boolean;
    emergencyCard: boolean; // Parte 6
  };
  isOffline: boolean; // Parte 6
}

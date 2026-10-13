export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type AppointmentType =
  | "CHECKUP"
  | "CONSULTATION"
  | "FOLLOW_UP"
  | "ROUTINE_EXAM"
  | "EMERGENCY"
  | "SPECIALIST_VISIT";

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email?: string | null;
  phone?: string | null;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientContact?: string | null;
  doctorId: string;
  doctor: Doctor;
  appointmentDate: string; // ISO string
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedSearchFilters {
  patientName?: string | null;
  doctorName?: string | null;
  doctorId?: string | null;
  status?: AppointmentStatus | null;
  appointmentType?: AppointmentType | null;
  startDate?: string | null;
  endDate?: string | null;
  rawSearchTerm?: string | null;
}

export interface AppointmentStats {
  total: number;
  todayCount: number;
  confirmedCount: number;
  cancelledCount: number;
  completedCount: number;
}

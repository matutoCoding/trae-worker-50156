export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  code?: string;
  patientName: string;
  patientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: number;
  chairId: string;
  chairName?: string;
  doctorId?: string;
  doctorName?: string;
  department: string;
  status: AppointmentStatus;
  type?: string;
  createTime?: string;
  createdAt?: string;
}

export interface ScheduleDay {
  date: string;
  weekday: string;
  isToday: boolean;
  timeSlots: ScheduleTimeSlot[];
}

export interface ScheduleTimeSlot {
  id: string;
  time: string;
  available: boolean;
  availableChairs: number;
  totalChairs: number;
  isAvailable?: boolean;
  availableCount?: number;
  totalCount?: number;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  chairId: string;
  chairName: string;
  doctorId?: string;
  doctorName?: string;
  department: string;
  status: AppointmentStatus;
  type: string;
  createTime: string;
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
}

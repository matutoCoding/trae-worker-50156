export type DoctorStatus = 'onDuty' | 'offDuty' | 'leave';

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  avatar: string;
  status: DoctorStatus;
  chairId?: string;
  specialty: string;
  todayPatients: number;
}

export interface RosterDay {
  date: string;
  weekday: string;
  isToday: boolean;
  shifts: DoctorShift[];
}

export interface DoctorShift {
  doctorId: string;
  doctorName: string;
  chairId: string;
  chairName: string;
  shiftType: 'morning' | 'afternoon' | 'fullDay';
  startTime: string;
  endTime: string;
}

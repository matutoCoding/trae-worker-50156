export type ChairStatus = 'idle' | 'busy' | 'maintenance' | 'offline';

export interface Chair {
  id: string;
  name: string;
  number: number;
  status: ChairStatus;
  currentPatient?: string;
  currentNumber?: number;
  waitCount: number;
  loadRate: number;
  todayTotal: number;
  department: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
  chairId?: string;
}

export interface ChairSchedule {
  chairId: string;
  date: string;
  timeSlots: TimeSlot[];
}

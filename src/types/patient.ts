export interface Patient {
  id: string;
  name: string;
  phone: string;
  number: number;
  status: 'waiting' | 'calling' | 'visiting' | 'completed' | 'cancelled';
  chairId?: string;
  department: string;
  doctorId?: string;
  estimatedTime?: string;
  takeTime: string;
  callTime?: string;
}

export interface QueueInfo {
  department: string;
  totalWaiting: number;
  avgWaitTime: number;
  chairs: {
    chairId: string;
    chairName: string;
    currentNumber: number;
    waitCount: number;
  }[];
}

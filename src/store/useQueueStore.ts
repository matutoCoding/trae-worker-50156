import { create } from 'zustand';
import type { Patient, QueueInfo } from '@/types/patient';
import { mockQueue, mockQueueInfo } from '@/data/mockQueue';

interface QueueState {
  patients: Patient[];
  queueInfo: QueueInfo;
  myNumber: Patient | null;
  loading: boolean;

  fetchQueue: () => void;
  takeNumber: (patientInfo: { name: string; phone: string; department: string }) => Patient;
  callNext: (chairId: string) => Patient | null;
  completeVisit: (patientId: string) => void;
  getWaitingCount: () => number;
  getMyPosition: () => number;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  patients: mockQueue,
  queueInfo: mockQueueInfo,
  myNumber: mockQueue.find(p => p.status === 'waiting') || null,
  loading: false,

  fetchQueue: () => {
    console.log('[QueueStore] 获取排队信息');
    set({ loading: true });
    setTimeout(() => {
      set({ loading: false });
    }, 300);
  },

  takeNumber: (patientInfo) => {
    console.log('[QueueStore] 取号:', patientInfo);
    const maxNumber = Math.max(...get().patients.map(p => p.number), 1000);
    const newNumber = maxNumber + 1;

    const newPatient: Patient = {
      id: `patient-${Date.now()}`,
      name: patientInfo.name,
      phone: patientInfo.phone,
      number: newNumber,
      status: 'waiting',
      department: patientInfo.department,
      takeTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    set(state => ({
      patients: [...state.patients, newPatient],
      myNumber: newPatient,
      queueInfo: {
        ...state.queueInfo,
        totalWaiting: state.queueInfo.totalWaiting + 1
      }
    }));

    return newPatient;
  },

  callNext: (chairId: string) => {
    console.log(`[QueueStore] 叫号: ${chairId}`);
    const waitingPatients = get().patients.filter(p => p.status === 'waiting');
    if (waitingPatients.length === 0) return null;

    const nextPatient = waitingPatients[0];

    set(state => ({
      patients: state.patients.map(p =>
        p.id === nextPatient.id
          ? { ...p, status: 'calling', chairId, callTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
          : p
      )
    }));

    return nextPatient;
  },

  completeVisit: (patientId: string) => {
    console.log(`[QueueStore] 完成就诊: ${patientId}`);
    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, status: 'completed' } : p
      )
    }));
  },

  getWaitingCount: () => {
    return get().patients.filter(p => p.status === 'waiting').length;
  },

  getMyPosition: () => {
    const { myNumber, patients } = get();
    if (!myNumber) return -1;

    const waitingPatients = patients.filter(p => p.status === 'waiting');
    const index = waitingPatients.findIndex(p => p.id === myNumber.id);
    return index + 1;
  }
}));

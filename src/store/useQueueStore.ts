import { create } from 'zustand';
import type { Patient, QueueInfo } from '@/types/patient';
import { mockQueue, mockQueueInfo } from '@/data/mockQueue';
import { useChairStore } from '@/store/useChairStore';

interface QueueState {
  patients: Patient[];
  queueInfo: QueueInfo;
  myNumber: Patient | null;
  loading: boolean;

  fetchQueue: () => void;
  takeNumber: (patientInfo: { name: string; phone: string; department: string }) => {
    patient: Patient;
    allocation: { chairId: string; chairName: string; estimatedWaitTime: number; reason: string } | null;
  };
  callNextByChair: (chairId: string) => Patient | null;
  completeVisit: (patientId: string) => void;
  getWaitingCount: () => number;
  getWaitingByChair: (chairId: string) => Patient[];
  getMyChairInfo: () => { chairName: string; chairPosition: number } | null;
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

    const chairState = useChairStore.getState();
    const allocation = chairState.getBestChair();

    const maxNumber = Math.max(...get().patients.map(p => p.number), 1000);
    const newNumber = maxNumber + 1;

    const estimatedMinutes = allocation?.estimatedWaitTime ?? 0;
    const now = new Date();
    now.setMinutes(now.getMinutes() + estimatedMinutes);
    const estimatedTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const newPatient: Patient = {
      id: `patient-${Date.now()}`,
      name: patientInfo.name,
      phone: patientInfo.phone,
      number: newNumber,
      status: 'waiting',
      chairId: allocation?.chairId,
      department: patientInfo.department,
      estimatedTime,
      takeTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    if (allocation) {
      chairState.incrementWaitCount(allocation.chairId);
    }

    set(state => ({
      patients: [...state.patients, newPatient],
      myNumber: newPatient,
      queueInfo: {
        ...state.queueInfo,
        totalWaiting: state.queueInfo.totalWaiting + 1,
        chairs: allocation
          ? state.queueInfo.chairs.map(c =>
              c.chairId === allocation.chairId
                ? { ...c, waitCount: c.waitCount + 1 }
                : c
            )
          : state.queueInfo.chairs
      }
    }));

    console.log('[QueueStore] 分配结果:', { patient: newPatient, allocation });

    return {
      patient: newPatient,
      allocation: allocation
        ? {
            chairId: allocation.chairId,
            chairName: allocation.chairName,
            estimatedWaitTime: allocation.estimatedWaitTime,
            reason: allocation.reason
          }
        : null
    };
  },

  callNextByChair: (chairId: string) => {
    console.log(`[QueueStore] 牙椅 ${chairId} 叫下一位`);

    const chairPatients = get()
      .patients
      .filter(p => p.chairId === chairId && p.status === 'waiting')
      .sort((a, b) => a.number - b.number);

    if (chairPatients.length === 0) {
      console.log(`[QueueStore] 牙椅 ${chairId} 无等待患者`);
      return null;
    }

    const nextPatient = chairPatients[0];
    const chairState = useChairStore.getState();
    const chair = chairState.getChairById(chairId);

    console.log(`[QueueStore] 叫号: ${nextPatient.number} ${nextPatient.name} -> ${chair?.name}`);

    set(state => ({
      patients: state.patients.map(p =>
        p.id === nextPatient.id
          ? {
              ...p,
              status: 'visiting',
              chairId,
              callTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            }
          : p
      ),
      queueInfo: {
        ...state.queueInfo,
        totalWaiting: Math.max(0, state.queueInfo.totalWaiting - 1),
        chairs: state.queueInfo.chairs.map(c =>
          c.chairId === chairId
            ? {
                ...c,
                currentNumber: nextPatient.number,
                waitCount: Math.max(0, c.waitCount - 1)
              }
            : c
        )
      }
    }));

    chairState.decrementWaitCount(chairId);
    chairState.setCurrentPatient(chairId, nextPatient.name, nextPatient.number);

    return nextPatient;
  },

  completeVisit: (patientId: string) => {
    console.log(`[QueueStore] 完成就诊: ${patientId}`);
    const patient = get().patients.find(p => p.id === patientId);

    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, status: 'completed' } : p
      )
    }));

    if (patient?.chairId) {
      const chairState = useChairStore.getState();
      chairState.incrementTodayTotal(patient.chairId);
    }
  },

  getWaitingCount: () => {
    return get().patients.filter(p => p.status === 'waiting').length;
  },

  getWaitingByChair: (chairId: string) => {
    return get()
      .patients
      .filter(p => p.chairId === chairId && p.status === 'waiting')
      .sort((a, b) => a.number - b.number);
  },

  getMyChairInfo: () => {
    const { myNumber } = get();
    if (!myNumber || !myNumber.chairId) return null;

    const chairState = useChairStore.getState();
    const chair = chairState.getChairById(myNumber.chairId);
    if (!chair) return null;

    const chairWaiters = get().getWaitingByChair(myNumber.chairId);
    const myIndex = chairWaiters.findIndex(p => p.id === myNumber.id);

    return {
      chairName: chair.name,
      chairPosition: myIndex === -1 ? 0 : myIndex + 1
    };
  },

  getMyPosition: () => {
    const { myNumber, patients } = get();
    if (!myNumber) return -1;

    if (myNumber.chairId) {
      const chairWaiters = patients
        .filter(p => p.chairId === myNumber.chairId && p.status === 'waiting')
        .sort((a, b) => a.number - b.number);
      const index = chairWaiters.findIndex(p => p.id === myNumber.id);
      return index === -1 ? -1 : index + 1;
    }

    const waitingPatients = patients.filter(p => p.status === 'waiting');
    const index = waitingPatients.findIndex(p => p.id === myNumber.id);
    return index + 1;
  }
}));

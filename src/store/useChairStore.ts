import { create } from 'zustand';
import type { Chair } from '@/types/chair';
import { mockChairs } from '@/data/mockChairs';
import { findBestChair, calculateLoadRate } from '@/utils/loadBalancer';

interface ChairState {
  chairs: Chair[];
  loading: boolean;
  fetchChairs: () => void;
  getChairById: (id: string) => Chair | undefined;
  getBestChair: () => ReturnType<typeof findBestChair>;
  updateChairStatus: (id: string, status: Chair['status']) => void;
  incrementWaitCount: (id: string) => void;
  decrementWaitCount: (id: string) => void;
  setCurrentPatient: (id: string, patientName: string, patientNumber: number) => void;
  incrementTodayTotal: (id: string) => void;
  clearCurrentPatient: (id: string) => void;
}

export const useChairStore = create<ChairState>((set, get) => ({
  chairs: mockChairs,
  loading: false,

  fetchChairs: () => {
    console.log('[ChairStore] 刷新牙椅列表（不重置状态，保持现有数据）');
    set({ loading: true });
    setTimeout(() => {
      set(state => ({ loading: false, chairs: state.chairs }));
    }, 300);
  },

  getChairById: (id: string) => {
    return get().chairs.find(chair => chair.id === id);
  },

  getBestChair: () => {
    return findBestChair(get().chairs);
  },

  updateChairStatus: (id: string, status: Chair['status']) => {
    console.log(`[ChairStore] 更新牙椅状态: ${id} -> ${status}`);
    set(state => ({
      chairs: state.chairs.map(chair =>
        chair.id === id ? { ...chair, status } : chair
      )
    }));
  },

  incrementWaitCount: (id: string) => {
    set(state => ({
      chairs: state.chairs.map(chair => {
        if (chair.id === id) {
          const newWaitCount = chair.waitCount + 1;
          const newStatus: Chair['status'] = chair.status === 'idle' ? 'busy' : chair.status;
          return {
            ...chair,
            waitCount: newWaitCount,
            loadRate: calculateLoadRate(newWaitCount),
            status: newStatus
          };
        }
        return chair;
      })
    }));
  },

  decrementWaitCount: (id: string) => {
    set(state => ({
      chairs: state.chairs.map(chair => {
        if (chair.id === id) {
          const newWaitCount = Math.max(0, chair.waitCount - 1);
          return {
            ...chair,
            waitCount: newWaitCount,
            loadRate: calculateLoadRate(newWaitCount),
            status: newWaitCount === 0 && !chair.currentPatient ? 'idle' : chair.status
          };
        }
        return chair;
      })
    }));
  },

  setCurrentPatient: (id: string, patientName: string, patientNumber: number) => {
    console.log(`[ChairStore] 牙椅 ${id} 当前患者: ${patientName} #${patientNumber}`);
    set(state => ({
      chairs: state.chairs.map(chair =>
        chair.id === id
          ? {
              ...chair,
              status: 'busy',
              currentPatient: patientName,
              currentNumber: patientNumber
            }
          : chair
      )
    }));
  },

  clearCurrentPatient: (id: string) => {
    set(state => ({
      chairs: state.chairs.map(chair => {
        if (chair.id === id) {
          const newWaitCount = chair.waitCount;
          return {
            ...chair,
            currentPatient: undefined,
            currentNumber: undefined,
            status: newWaitCount === 0 ? 'idle' : 'busy'
          };
        }
        return chair;
      })
    }));
  },

  incrementTodayTotal: (id: string) => {
    set(state => ({
      chairs: state.chairs.map(chair =>
        chair.id === id
          ? {
              ...chair,
              todayTotal: chair.todayTotal + 1
            }
          : chair
      )
    }));
  }
}));

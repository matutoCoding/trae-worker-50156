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
}

export const useChairStore = create<ChairState>((set, get) => ({
  chairs: mockChairs,
  loading: false,

  fetchChairs: () => {
    console.log('[ChairStore] 获取牙椅列表');
    set({ loading: true });
    setTimeout(() => {
      set({ chairs: mockChairs, loading: false });
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
          return {
            ...chair,
            waitCount: newWaitCount,
            loadRate: calculateLoadRate(newWaitCount)
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
            loadRate: calculateLoadRate(newWaitCount)
          };
        }
        return chair;
      })
    }));
  }
}));

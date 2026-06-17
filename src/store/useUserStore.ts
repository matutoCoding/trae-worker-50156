import { create } from 'zustand';

interface UserState {
  isLoggedIn: boolean;
  userInfo: {
    id: string;
    name: string;
    phone: string;
    avatar: string;
  } | null;

  login: (phone: string, code: string) => Promise<boolean>;
  logout: () => void;
  updateUserInfo: (info: Partial<UserState['userInfo']>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  isLoggedIn: true,
  userInfo: {
    id: 'user-001',
    name: '张先生',
    phone: '138****5678',
    avatar: 'https://picsum.photos/id/64/200/200'
  },

  login: async (phone: string) => {
    console.log('[UserStore] 登录:', phone);
    await new Promise(resolve => setTimeout(resolve, 1000));
    set({
      isLoggedIn: true,
      userInfo: {
        id: 'user-001',
        name: '张先生',
        phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        avatar: 'https://picsum.photos/id/64/200/200'
      }
    });
    return true;
  },

  logout: () => {
    console.log('[UserStore] 登出');
    set({ isLoggedIn: false, userInfo: null });
  },

  updateUserInfo: (info) => {
    set(state => ({
      userInfo: state.userInfo ? { ...state.userInfo, ...info } : null
    }));
  }
}));

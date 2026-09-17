import { create } from 'zustand';
import type { User } from '@/types/user';
import { devtools } from 'zustand/middleware';

type AuthState = {
  accessToken: string | null;
  user: User | null;
  actions: {
    setAuth: (token: string, user: User) => void;
    clearAuth: () => void;
  };
};

const useAuthStore = create<AuthState>()(
  devtools((set) => ({
    accessToken: null,
    user: null,
    actions: {
      setAuth: (token, user) => set({ accessToken: token, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    },
  })),
);

export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useUser = () => useAuthStore((state) => state.user);
export const useAuthActions = () => useAuthStore((state) => state.actions);

export const getAccessToken = () => useAuthStore.getState().accessToken;
export const clearAuthSession = () => useAuthStore.getState().actions.clearAuth();

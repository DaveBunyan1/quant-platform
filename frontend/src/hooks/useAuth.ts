import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const { accessToken, user, setAuth, clearAuth } = useAuthStore();
  return {
    accessToken,
    user,
    isAuthenticated: !!accessToken && !!user,
    setAuth,
    clearAuth,
  };
};

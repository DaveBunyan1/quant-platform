import { useAccessToken, useAuthActions, useUser } from '@/stores/authStore';

export const useAuth = () => {
  const accessToken = useAccessToken();
  const user = useUser();
  const { setAuth, clearAuth } = useAuthActions();
  return {
    accessToken,
    user,
    isAuthenticated: !!accessToken && !!user,
    setAuth,
    clearAuth,
  };
};

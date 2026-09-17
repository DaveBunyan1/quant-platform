import { useEffect, useState } from 'react';
import { refresh } from '@/api/auth';
import { getCurrentUser } from '@/api/users';
import { useAuthStore } from '@/stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const restore = async () => {
      try {
        const { data } = await refresh();
        const me = await getCurrentUser();
        setAuth(data.access_token, me.data);
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, [setAuth, clearAuth]);

  if (isLoading) return null;
  return <>{children}</>;
}

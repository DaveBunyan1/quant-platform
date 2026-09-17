import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { tokenStore } from '@/lib/token';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await authApi.me();
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!tokenStore.get(),
  });
}

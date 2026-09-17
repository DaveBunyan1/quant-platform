import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/users';
import { useAuthStore } from '@/stores/authStore';

export const useUser = () => {
  const token = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const { data } = await getCurrentUser();
      return data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
};

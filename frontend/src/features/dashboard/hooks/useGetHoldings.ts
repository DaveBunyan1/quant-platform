import { useQuery } from '@tanstack/react-query';
import { holdingsApi } from '../api/holdings';
import type { User } from '@/features/auth/types/authTypes';

const useGetHoldings = (user: User | null) => {
  return useQuery({
    queryKey: ['holdings', user?.id],
    queryFn: async () => {
      const { data } = await holdingsApi.getHoldings();
      return data;
    },
    enabled: !!user,
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
};

export default useGetHoldings;

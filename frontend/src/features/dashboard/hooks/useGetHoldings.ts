import { useQuery } from '@tanstack/react-query';
import { holdingsApi } from '../api/holdings';
import type { User } from '@/features/auth/types/authTypes';
import type { PortfolioSummaryResponse } from '../types/types';

const useGetHoldings = (user: User | null) => {
  return useQuery<PortfolioSummaryResponse>({
    queryKey: ['holdings', user?.id],
    queryFn: async () => {
      const { data } = await holdingsApi.getHoldings();
      return data;
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30 * 1000,
  });
};

export default useGetHoldings;

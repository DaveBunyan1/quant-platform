import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,

      retry: (failureCount, error: Error) => {
        if (isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 401 || status === 403) return false;
        }
        return failureCount < 2;
      },

      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

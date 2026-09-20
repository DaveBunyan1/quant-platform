import { useMutation, useQueryClient } from '@tanstack/react-query';
import { holdingsApi } from '../api/holdings';
import type { CreateTransactionPayload } from '../types/types';

export const useAddHolding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => {
      return holdingsApi.addTransaction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    },
  });
};

import { api } from '@/api/client';
import type { CreateTransactionPayload, HoldingsResponse } from '../types/types';

export const holdingsApi = {
  getHoldings: () => {
    return api.get<HoldingsResponse>('/api/transactions');
  },
  addTransaction: (payload: CreateTransactionPayload) => {
    return api.post('/api/transactions', payload);
  },
};

import { api } from '@/api/client';
import type { CreateTransactionPayload, PortfolioSummaryResponse } from '../types/types';

export const holdingsApi = {
  getHoldings: () => {
    return api.get<PortfolioSummaryResponse>('/api/holdings/');
  },
  addTransaction: (payload: CreateTransactionPayload) => {
    return api.post('/api/transactions', payload);
  },
};

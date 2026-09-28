import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/api/client';
import type { CreateTransactionPayload, PortfolioSummaryResponse } from '../types/types';
import { holdingsApi } from '../api/holdings';

// Mock the API client
vi.mock('@/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('holdingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHoldings', () => {
    const mockPortfolioSummary: PortfolioSummaryResponse = {
      totalValue: 15000,
      totalGainLoss: 2500,
      holdings: [
        { id: '1', symbol: 'AAPL', quantity: 10, currentPrice: 150 },
        { id: '2', symbol: 'GOOGL', quantity: 5, currentPrice: 2000 },
      ],
    } as unknown as PortfolioSummaryResponse;

    it('fetches holdings summary from correct endpoint', async () => {
      vi.mocked(api.get).mockResolvedValueOnce(mockPortfolioSummary);

      const result = await holdingsApi.getHoldings();

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/api/holdings/');
      expect(result).toEqual(mockPortfolioSummary);
    });

    it('propagates errors when fetching holdings fails', async () => {
      const apiError = new Error('Failed to fetch holdings');
      vi.mocked(api.get).mockRejectedValueOnce(apiError);

      await expect(holdingsApi.getHoldings()).rejects.toThrow('Failed to fetch holdings');
    });
  });

  describe('addTransaction', () => {
    const mockPayload: CreateTransactionPayload = {
      symbol: 'AAPL',
      type: 'BUY',
      quantity: 5,
      price: 150,
    } as unknown as CreateTransactionPayload;

    const mockResponse = { id: 'tx-123', status: 'success' };

    it('posts transaction payload to correct endpoint', async () => {
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const result = await holdingsApi.addTransaction(mockPayload);

      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/api/transactions', mockPayload);
      expect(result).toEqual(mockResponse);
    });

    it('propagates errors when creating a transaction fails', async () => {
      const apiError = new Error('Invalid transaction payload');
      vi.mocked(api.post).mockRejectedValueOnce(apiError);

      await expect(holdingsApi.addTransaction(mockPayload)).rejects.toThrow(
        'Invalid transaction payload',
      );
    });
  });
});

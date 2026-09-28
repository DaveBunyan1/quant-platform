import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { holdingsApi } from '../api/holdings';
import type { User } from '@/features/auth/types/authTypes';
import type { PortfolioSummaryResponse } from '../types/types';
import useGetHoldings from '../hooks/useGetHoldings';

vi.mock('../api/holdings', () => ({
  holdingsApi: {
    getHoldings: vi.fn(),
  },
}));

describe('useGetHoldings', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockUser: User = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Jane Doe',
  } as unknown as User;

  const mockHoldingsData: PortfolioSummaryResponse = {
    totalValue: 25000,
    totalGainLoss: 3200,
    holdings: [
      {
        id: '1',
        symbol: 'AAPL',
        quantity: 15,
        currentPrice: 175,
      },
    ],
  } as unknown as PortfolioSummaryResponse;

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          retryDelay: 0,
        },
      },
    });
  });

  it('fetches holdings data when a valid user is provided', async () => {
    vi.mocked(holdingsApi.getHoldings).mockResolvedValueOnce({
      data: mockHoldingsData,
    } as any);

    const { result } = renderHook(() => useGetHoldings(mockUser), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(holdingsApi.getHoldings).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockHoldingsData);
  });

  it('does not fetch when user is null', () => {
    const { result } = renderHook(() => useGetHoldings(null), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
    expect(holdingsApi.getHoldings).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('uses the user id in the query key', async () => {
    vi.mocked(holdingsApi.getHoldings).mockResolvedValueOnce({
      data: mockHoldingsData,
    } as any);

    const { result } = renderHook(() => useGetHoldings(mockUser), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(['holdings', mockUser.id]);

    expect(cachedData).toEqual(mockHoldingsData);
  });

  it('handles API errors when fetching holdings fails', async () => {
    const apiError = new Error('Failed to fetch portfolio data');

    vi.mocked(holdingsApi.getHoldings).mockRejectedValue(apiError);

    const { result } = renderHook(() => useGetHoldings(mockUser), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(holdingsApi.getHoldings).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe(apiError);
    expect(result.current.data).toBeUndefined();
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { holdingsApi } from '../api/holdings';
import type { CreateTransactionPayload } from '../types/types';
import { useAddHolding } from '../hooks/useAddHolding';

// Mock holdingsApi
vi.mock('../api/holdings', () => ({
  holdingsApi: {
    addTransaction: vi.fn(),
  },
}));

describe('useAddHolding', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockPayload: CreateTransactionPayload = {
    symbol: 'AAPL',
    type: 'BUY',
    quantity: 10,
    price: 150,
  } as unknown as CreateTransactionPayload;

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.spyOn(queryClient, 'invalidateQueries');
  });

  it('calls holdingsApi.addTransaction with payload and invalidates ["holdings"] query key on success', async () => {
    const mockSuccessResponse = { id: 'tx-100', status: 'created' };
    vi.mocked(holdingsApi.addTransaction).mockResolvedValueOnce(mockSuccessResponse as any);

    const { result } = renderHook(() => useAddHolding(), { wrapper });

    result.current.mutate(mockPayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(holdingsApi.addTransaction).toHaveBeenCalledTimes(1);
    expect(holdingsApi.addTransaction).toHaveBeenCalledWith(mockPayload);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['holdings'],
    });
  });

  it('handles errors without invalidating the ["holdings"] query cache', async () => {
    const apiError = new Error('Failed to create transaction');
    vi.mocked(holdingsApi.addTransaction).mockRejectedValueOnce(apiError);

    const { result } = renderHook(() => useAddHolding(), { wrapper });

    result.current.mutate(mockPayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(holdingsApi.addTransaction).toHaveBeenCalledWith(mockPayload);
    expect(result.current.error).toBe(apiError);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});

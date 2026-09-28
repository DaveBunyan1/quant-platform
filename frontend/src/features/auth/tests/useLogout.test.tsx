import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { authApi } from '../api/auth';
import { tokenStore } from '@/lib/token';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';

// Mock external dependencies
vi.mock('../api/auth', () => ({
  authApi: {
    logout: vi.fn(),
  },
}));

vi.mock('@/lib/token', () => ({
  tokenStore: {
    clear: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('useLogout', () => {
  let queryClient: QueryClient;
  const mockNavigate = vi.fn();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Spy on queryClient methods to verify cache cleanup
    vi.spyOn(queryClient, 'setQueryData');
    vi.spyOn(queryClient, 'clear');

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('clears token, resets cache, and redirects to /login on successful logout', async () => {
    vi.mocked(authApi.logout).mockResolvedValueOnce(undefined as any);

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(tokenStore.clear).toHaveBeenCalledTimes(1);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['user'], null);
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('clears token, resets cache, and redirects to /login even if logout API call fails', async () => {
    vi.mocked(authApi.logout).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Cleanup should still run via onError handler
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(tokenStore.clear).toHaveBeenCalledTimes(1);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['user'], null);
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { authApi } from '../api/auth';
import { tokenStore } from '@/lib/token';
import type { User } from '@/features/auth/types/authTypes';
import { useUser } from '../hooks/useUser';

// Mock dependencies
vi.mock('../api/auth', () => ({
  authApi: {
    me: vi.fn(),
  },
}));

vi.mock('@/lib/token', () => ({
  tokenStore: {
    get: vi.fn(),
  },
}));

describe('useUser', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockUserData: User = {
    id: '123',
    email: 'user@example.com',
    username: 'Jane Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('fetches user data successfully when a token exists in tokenStore', async () => {
    vi.mocked(tokenStore.get).mockReturnValue('valid-auth-token');
    vi.mocked(authApi.me).mockResolvedValueOnce({
      data: mockUserData,
    } as any);

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(tokenStore.get).toHaveBeenCalled();
    expect(authApi.me).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockUserData);
  });

  it('remains disabled and does not call authApi.me when tokenStore has no token', async () => {
    vi.mocked(tokenStore.get).mockReturnValue(null);

    const { result } = renderHook(() => useUser(), { wrapper });

    // When enabled is false, status remains 'pending' with fetchStatus 'idle'
    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
    expect(authApi.me).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('handles API errors when fetching user fails', async () => {
    vi.mocked(tokenStore.get).mockReturnValue('valid-auth-token');
    const apiError = new Error('Unauthorized');
    vi.mocked(authApi.me).mockRejectedValueOnce(apiError);

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(authApi.me).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe(apiError);
    expect(result.current.data).toBeUndefined();
  });

  it('serves data from cache during staleTime without triggering additional API calls', async () => {
    vi.mocked(tokenStore.get).mockReturnValue('valid-auth-token');
    vi.mocked(authApi.me).mockResolvedValueOnce({
      data: mockUserData,
    } as any);

    // Initial render populates cache
    const { result, unmount } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    unmount();

    // Second render within staleTime (5 mins) should read from cache
    const { result: secondResult } = renderHook(() => useUser(), { wrapper });

    expect(secondResult.current.data).toEqual(mockUserData);
    expect(authApi.me).toHaveBeenCalledTimes(1); // Call count remains 1
  });
});

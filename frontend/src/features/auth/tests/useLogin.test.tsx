import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { authApi } from '../api/auth';
import { tokenStore } from '@/lib/token';
import { api } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';

vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

vi.mock('@/lib/token', () => ({
  tokenStore: {
    set: vi.fn(),
  },
}));

vi.mock('@/api/client', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('useLogin', () => {
  let queryClient: QueryClient;
  const mockNavigate = vi.fn();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const credentials = {
    username: 'testuser',
    password: 'password123',
  };

  const mockUserData = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('performs successful login flow: stores token, fetches user, updates query cache, and navigates', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({
      data: { access_token: 'mock-access-token' },
    } as any);

    vi.mocked(api.get).mockResolvedValueOnce({
      data: mockUserData,
    } as any);

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate(credentials);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify token acquisition and storage
    expect(authApi.login).toHaveBeenCalledWith(credentials);
    expect(tokenStore.set).toHaveBeenCalledWith('mock-access-token');

    // Verify user fetch with bearer token
    expect(api.get).toHaveBeenCalledWith('/users/me', {
      headers: { Authorization: 'Bearer mock-access-token' },
    });

    // Verify cache population and redirect
    expect(queryClient.getQueryData(['user'])).toEqual(mockUserData);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('throws an error and halts execution if access_token is missing from login response', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({
      data: {}, // No access_token returned
    } as any);

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate(credentials);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('No access_token returned from login');
    expect(tokenStore.set).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles authApi.login API failure', async () => {
    const loginError = new Error('Invalid credentials');
    vi.mocked(authApi.login).mockRejectedValueOnce(loginError);

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate(credentials);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(loginError);
    expect(tokenStore.set).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles user fetch (/users/me) failure after successful token acquisition', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({
      data: { access_token: 'mock-access-token' },
    } as any);

    const userFetchError = new Error('Failed to fetch user');
    vi.mocked(api.get).mockRejectedValueOnce(userFetchError);

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate(credentials);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(tokenStore.set).toHaveBeenCalledWith('mock-access-token');
    expect(result.current.error).toBe(userFetchError);
    expect(queryClient.getQueryData(['user'])).toBeUndefined();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

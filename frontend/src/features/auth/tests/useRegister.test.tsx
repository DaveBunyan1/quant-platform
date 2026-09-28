import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { authApi } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useRegister';

// Mock dependencies
vi.mock('../api/auth', () => ({
  authApi: {
    register: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('useRegister', () => {
  let queryClient: QueryClient;
  const mockNavigate = vi.fn();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockRegisterPayload = {
    email: 'newuser@example.com',
    username: 'newuser',
    password: 'Password123!',
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

  it('calls authApi.register and navigates to /login on successful registration', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({
      data: { message: 'User registered successfully' },
    } as any);

    const { result } = renderHook(() => useRegister(), { wrapper });

    result.current.mutate(mockRegisterPayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(authApi.register).toHaveBeenCalledTimes(1);
    expect(authApi.register).toHaveBeenCalledWith(
      mockRegisterPayload,
      expect.objectContaining({ client: expect.any(Object) }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('sets error state and does not navigate when authApi.register fails', async () => {
    const registerError = new Error('Email already taken');
    vi.mocked(authApi.register).mockRejectedValueOnce(registerError);

    const { result } = renderHook(() => useRegister(), { wrapper });

    result.current.mutate(mockRegisterPayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(authApi.register).toHaveBeenCalledWith(
      mockRegisterPayload,
      expect.objectContaining({ client: expect.any(Object) }),
    );
    expect(result.current.error).toBe(registerError);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

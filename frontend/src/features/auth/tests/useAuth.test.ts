import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { User } from '@/features/auth/types/authTypes';
import { useUser } from '../hooks/useUser';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn(),
}));

describe('useAuth', () => {
  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    username: 'Jane Doe',
  };

  const mockUseUser = (overrides = {}) =>
    ({
      data: undefined,
      isLoading: false,
      isError: false,
      isFetching: false,
      ...overrides,
    }) as ReturnType<typeof useUser>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isAuthenticated as true when user data exists and no error occurred', () => {
    vi.mocked(useUser).mockReturnValue(
      mockUseUser({
        data: mockUser,
      }),
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });

  it('returns isAuthenticated as false when user is undefined or null', () => {
    vi.mocked(useUser).mockReturnValue(
      mockUseUser({
        data: undefined,
      }),
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('returns isAuthenticated as false when an error occurs, even if stale user data remains', () => {
    vi.mocked(useUser).mockReturnValue(
      mockUseUser({
        data: mockUser, // stale data from cache
        isError: true,
      }),
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('passes through isLoading and isFetching states correctly', () => {
    vi.mocked(useUser).mockReturnValue(
      mockUseUser({
        data: undefined,
        isLoading: true,
        isFetching: true,
      }),
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });
});

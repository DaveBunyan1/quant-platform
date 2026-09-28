import { describe, it, expect, vi, beforeEach } from 'vitest';

import { api } from '../../../api/client';
import type { User } from '@/features/auth/types/authTypes';
import { getCurrentUser } from '../api/users';

vi.mock('../../../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('getCurrentUser', () => {
  const mockUser: User = {
    id: '123',
    email: 'user@example.com',
    username: 'Jane Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends request with Authorization header when token is provided', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(mockUser);
    const token = 'sample-jwt-token';

    const result = await getCurrentUser(token);

    expect(api.get).toHaveBeenCalledWith('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(result).toBe(mockUser);
  });

  it('sends request without Authorization header when token is omitted', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(mockUser);

    const result = await getCurrentUser();

    expect(api.get).toHaveBeenCalledWith('/users/me', {});
    expect(result).toBe(mockUser);
  });

  it('propagates errors when API call fails', async () => {
    const apiError = new Error('Unauthorized');
    vi.mocked(api.get).mockRejectedValueOnce(apiError);

    await expect(getCurrentUser('invalid-token')).rejects.toThrow('Unauthorized');
  });
});

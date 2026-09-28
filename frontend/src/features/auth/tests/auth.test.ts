import { describe, it, expect, vi, beforeEach } from 'vitest';

import { api } from '@/api/client';
import { authApi } from '../api/auth';

vi.mock('@/api/client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('sends credentials as URLSearchParams with application/x-www-form-urlencoded header', async () => {
      const mockResponse = { data: { access_token: 'test-access-token', token_type: 'bearer' } };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const credentials = { username: 'testuser', password: 'password123' };
      const result = await authApi.login(credentials);

      const expectedParams = new URLSearchParams();
      expectedParams.append('username', credentials.username);
      expectedParams.append('password', credentials.password);

      expect(api.post).toHaveBeenCalledWith('/auth/login', expectedParams, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('calls /auth/register with user creation data', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockUser });

      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      const result = await authApi.register(registerData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('refresh', () => {
    it('calls /auth/refresh endpoint', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { ok: true } });

      await authApi.refresh();

      expect(api.post).toHaveBeenCalledWith('/auth/refresh');
    });
  });

  describe('logout', () => {
    it('calls /auth/logout endpoint', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { ok: true } });

      await authApi.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('me', () => {
    it('calls /users/me endpoint', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser });

      const result = await authApi.me();

      expect(api.get).toHaveBeenCalledWith('/users/me');
      expect(result.data).toEqual(mockUser);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/api/client';
import { tokenStore } from '@/lib/token';
import { queryClient } from '@/lib/queryClient';
import { bootstrapAuth } from '../api/bootstrap';

vi.mock('@/api/client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/lib/token', () => ({
  tokenStore: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    setQueryData: vi.fn(),
  },
}));

describe('bootstrapAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips bootstrap if token already exists in tokenStore', async () => {
    vi.mocked(tokenStore.get).mockReturnValue('existing-token');

    await bootstrapAuth();

    expect(api.post).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('successfully refreshes token and hydrates queryClient user data', async () => {
    vi.mocked(tokenStore.get).mockReturnValue(null);
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: 'new-bootstrap-token' },
    });
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { id: 1, name: 'Alice' },
    });

    await bootstrapAuth();

    expect(api.post).toHaveBeenCalledWith('/auth/refresh');
    expect(tokenStore.set).toHaveBeenCalledWith('new-bootstrap-token');
    expect(api.get).toHaveBeenCalledWith('/users/me');
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['user'], {
      id: 1,
      name: 'Alice',
    });
  });

  it('clears token store and sets user to null on 403 or other refresh errors', async () => {
    vi.mocked(tokenStore.get).mockReturnValue(null);
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { status: 403 },
    });

    await bootstrapAuth();

    expect(api.post).toHaveBeenCalledWith('/auth/refresh');
    expect(tokenStore.clear).toHaveBeenCalled();
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['user'], null);
  });
});

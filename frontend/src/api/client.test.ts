import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { api } from './client';
import { tokenStore } from '@/lib/token';
import { queryClient } from '@/lib/queryClient';

api.defaults.adapter = 'http';
axios.defaults.adapter = 'http';

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

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe('API Client Interceptors', () => {
  describe('Request Interceptor', () => {
    it('attaches Bearer token to request headers if token exists', async () => {
      vi.mocked(tokenStore.get).mockReturnValue('valid-token-123');

      server.use(
        http.get('*/test', ({ request }) => {
          return HttpResponse.json({
            authHeader: request.headers.get('Authorization'),
          });
        }),
      );

      const res = await api.get('/test');
      expect(res.data.authHeader).toBe('Bearer valid-token-123');
    });

    it('does not attach Authorization header if token does not exist', async () => {
      vi.mocked(tokenStore.get).mockReturnValue(null);

      server.use(
        http.get('*/test', ({ request }) => {
          return HttpResponse.json({
            hasAuthHeader: request.headers.has('Authorization'),
          });
        }),
      );

      const res = await api.get('/test');
      expect(res.data.hasAuthHeader).toBe(false);
    });
  });

  describe('Response Interceptor (Token Refresh)', () => {
    it('queues multiple concurrent failed requests while refreshing and retries all', async () => {
      const tokenState = { current: 'old-token' };

      vi.mocked(tokenStore.get).mockImplementation(() => tokenState.current);
      vi.mocked(tokenStore.set).mockImplementation((newToken: string | null) => {
        if (newToken) {
          tokenState.current = newToken;
        }
      });

      server.use(
        http.get('*/protected', ({ request }) => {
          const auth = request.headers.get('Authorization');

          if (!auth || auth === 'Bearer old-token') {
            return new HttpResponse(null, { status: 401 });
          }

          return HttpResponse.json({ ok: true, token: auth });
        }),
        http.post('*/auth/refresh', async () => {
          await new Promise((r) => setTimeout(r, 50));
          return HttpResponse.json({ access_token: 'refreshed-token' });
        }),
      );

      const [res1, res2, res3] = await Promise.all([
        api.get('/protected'),
        api.get('/protected'),
        api.get('/protected'),
      ]);

      expect(res1.data.token).toBe('Bearer refreshed-token');
      expect(res2.data.token).toBe('Bearer refreshed-token');
      expect(res3.data.token).toBe('Bearer refreshed-token');

      expect(tokenStore.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('Environment Variable Guard', () => {
    it('throws error if VITE_API_URL is missing', async () => {
      const originalUrl = import.meta.env.VITE_API_URL;

      vi.stubEnv('VITE_API_URL', '');

      await expect(async () => {
        vi.resetModules();
        await import('./client');
      }).rejects.toThrow('VITE_API_URL is not defined');

      vi.stubEnv('VITE_API_URL', originalUrl);
      vi.resetModules();
    });
  });

  describe('Non-401 Error Handling', () => {
    it('passes through non-401 errors without attempting refresh', async () => {
      server.use(
        http.get('*/500-error', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      await expect(api.get('/500-error')).rejects.toSatisfy((err: any) => {
        return err.response.status === 500;
      });

      expect(tokenStore.set).not.toHaveBeenCalled();
    });
  });

  describe('Refresh Failure & Queue Rejection', () => {
    it('rejects queued requests and clears tokens when refresh fails', async () => {
      const currentToken: string | null = 'old-token';
      vi.mocked(tokenStore.get).mockImplementation(() => currentToken);

      server.use(
        http.get('*/protected', () => {
          return new HttpResponse(null, { status: 401 });
        }),
        http.post('*/auth/refresh', async () => {
          await new Promise((r) => setTimeout(r, 20));
          return new HttpResponse(null, { status: 400 });
        }),
      );

      const p1 = api.get('/protected');
      const p2 = api.get('/protected');

      await expect(Promise.all([p1, p2])).rejects.toThrow();

      expect(tokenStore.clear).toHaveBeenCalled();
      expect(queryClient.setQueryData).toHaveBeenCalledWith(['user'], null);
    });
  });

  describe('Header Fallback Branches', () => {
    it('handles legacy plain-object headers safely', async () => {
      vi.mocked(tokenStore.get).mockReturnValue('plain-header-token');

      server.use(
        http.get('*/plain-headers', ({ request }) => {
          return HttpResponse.json({
            auth: request.headers.get('Authorization'),
          });
        }),
      );

      const res = await api.get('/plain-headers', {
        headers: { 'Content-Type': 'application/json' } as any,
      });

      expect(res.data.auth).toBe('Bearer plain-header-token');
    });
  });

  it('attaches CSRF token from cookie to request headers', async () => {
    document.cookie = 'csrftoken=test-csrf-token';

    vi.mocked(tokenStore.get).mockReturnValue(null);

    server.use(
      http.get('*/csrf-test', ({ request }) => {
        return HttpResponse.json({
          csrfHeader: request.headers.get('x-csrftoken'),
        });
      }),
    );

    const res = await api.get('/csrf-test');

    expect(res.data.csrfHeader).toBe('test-csrf-token');
  });

  it('rejects errors that do not contain an original request config', async () => {
    const handlers = (api.interceptors.response as any).handlers;

    const rejectedHandler = handlers[0].rejected;

    const error = new Error('Network error');

    await expect(rejectedHandler(error)).rejects.toBe(error);
  });

  it('rejects a 401 request that has already been retried', async () => {
    const handlers = (api.interceptors.response as any).handlers;
    const rejectedHandler = handlers[0].rejected;

    const error = {
      config: {
        _retry: true,
      },
      response: {
        status: 401,
      },
    };

    await expect(rejectedHandler(error)).rejects.toBe(error);

    expect(tokenStore.set).not.toHaveBeenCalled();
  });
});

import { queryClient } from '@/lib/queryClient';
import { tokenStore } from '@/lib/token';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is not defined');
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('x-csrftoken', csrfToken);
    } else {
      config.headers['x-csrftoken'] = csrfToken;
    }
  }

  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!original) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (typeof original.headers?.set === 'function') {
            original.headers.set('Authorization', `Bearer ${token}`);
          } else {
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${token}`;
          }
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const csrfToken = getCookie('csrftoken');

        // Pass CSRF token to the refresh request as well
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              ...(csrfToken ? { 'x-csrftoken': csrfToken } : {}),
            },
          },
        );

        tokenStore.set(data.access_token);
        processQueue(null, data.access_token);

        if (typeof original.headers?.set === 'function') {
          original.headers.set('Authorization', `Bearer ${data.access_token}`);
        } else {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${data.access_token}`;
        }

        return api(original);
      } catch (err) {
        processQueue(err, null);
        tokenStore.clear();
        queryClient.setQueryData(['user'], null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

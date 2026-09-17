import { api } from './axios';

export const login = (email: string, password: string) =>
  api.post('/auth/login', new URLSearchParams({ username: email, password }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

export const register = (data: { email: string; password: string; username: string }) =>
  api.post('/auth/register', data);

export const logout = () => api.post('/auth/logout');

export const refresh = () => api.post('/auth/refresh');

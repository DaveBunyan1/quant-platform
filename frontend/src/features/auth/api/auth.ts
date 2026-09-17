import { api } from '@/api/client';
import type { TokenPair, User, UserCreate } from '../types/authTypes';

export const authApi = {
  login: (credentials: { username: string; password: string }) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    return api.post<TokenPair>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  register: (data: { email: string; password: string; username: string }) =>
    api.post<UserCreate>('/auth/register', data),

  refresh: () => api.post('/auth/refresh'),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<User>('/users/me'),
};

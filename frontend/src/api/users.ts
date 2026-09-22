import type { User } from '@/features/auth/types/authTypes';
import { api } from './client';

export const getCurrentUser = async (token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return api.get<User>('/users/me', config);
};

import { api } from './axios';
import type { User } from '@/types/user';

export const getCurrentUser = async (token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return api.get<User>('/users/me', config);
};

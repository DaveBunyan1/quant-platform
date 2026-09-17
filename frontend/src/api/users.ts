import { api } from './axios';
import type { User } from '@/types/user';

export const getCurrentUser = () => api.get<User>('/users/me');

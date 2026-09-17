import axios from 'axios';
import { getAccessToken, clearAuthSession } from '@/stores/authStore';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // simple version – expand later
    if (error.response?.status === 401) {
      clearAuthSession();
    }
    return Promise.reject(error);
  },
);

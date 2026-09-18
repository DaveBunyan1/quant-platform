import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { tokenStore } from '@/lib/token';
import { api } from '@/api/client';

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const loginResponse = await authApi.login(credentials);

      const accessToken = loginResponse.data.access_token;

      if (!accessToken) {
        throw new Error('No access_token returned from login');
      }
      tokenStore.set(accessToken);

      const userResponse = await api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return userResponse.data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user);
      navigate('/', { replace: true });
    },
  });
}

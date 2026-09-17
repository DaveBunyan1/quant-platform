import { tokenStore } from '@/lib/token';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      tokenStore.clear();
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      tokenStore.clear();
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
      navigate('/login');
    },
  });
}

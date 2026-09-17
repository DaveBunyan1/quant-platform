import { api } from '../../../api/axios';
import type { User } from '../../../types/user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const loginUser = async (credentials: Record<string, string>) => {
  const { data } = await api.post<{ user: User; token: string }>('/auth/login', credentials);
  return data;
};

export async function fetchCurrentUser() {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

const USER_QUERY_KEY = ['user'];

export function useAuth() {
  const queryClient = useQueryClient();

  // 1. Fetch current user session automatically if a token exists
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: !!localStorage.getItem('token'), // Only run if a token is present
    retry: false,
    initialData: null,
  });

  // 2. Login mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Save token to persist session
      localStorage.setItem('token', data.token);

      // Directly update the query cache so the app re-renders instantly with the user data
      queryClient.setQueryData(USER_QUERY_KEY, data.user);
    },
  });

  // 3. Logout action
  const logout = () => {
    localStorage.removeItem('token');
    queryClient.setQueryData(USER_QUERY_KEY, null); // Clear the user cache
    queryClient.clear(); // Clear all cached data to prevent data leakage
  };

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}

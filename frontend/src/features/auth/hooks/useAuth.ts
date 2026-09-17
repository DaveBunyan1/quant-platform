import { useUser } from './useUser';

export function useAuth() {
  const { data: user, isLoading, isError, isFetching } = useUser();

  return {
    user,
    isAuthenticated: !!user && !isError,
    isLoading,
    isFetching,
  };
}

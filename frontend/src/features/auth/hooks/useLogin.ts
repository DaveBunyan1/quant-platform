import { login } from '@/api/auth';
import { getCurrentUser } from '@/api/users';
import { useAuthActions } from '@/stores/authStore';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const useLogin = () => {
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthActions();

  const loginMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const email = formData.get('username') as string;
      const password = formData.get('password') as string;

      const loginRes = await login(email, password);
      const { access_token } = loginRes.data;

      const meRes = await getCurrentUser(access_token);

      return { access_token, user: meRes.data };
    },
    onSuccess: ({ access_token, user }) => {
      setAuth(access_token, user);
      navigate('/');
    },
    onError: () => {
      clearAuth();
    },
  });

  const getErrorMessage = (err: any) => {
    if (!err) return null;

    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((e) => e.msg).join(', ');
    return err.message || 'Login failed. Please try again';
  };

  const errorMessage = getErrorMessage(loginMutation.error);
  const isPending = loginMutation.isPending;

  return { errorMessage, isPending, mutate: loginMutation.mutate };
};

export default useLogin;

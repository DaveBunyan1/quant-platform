import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import type { FormInput } from '../types/form';
import Form from '../component/ui/Form';
import { login } from '@/api/auth';
import { getCurrentUser } from '@/api/users';
import { useAuthStore } from '@/stores/authStore';

const loginInputs: FormInput[] = [
  {
    label: 'Email',
    name: 'username',
    type: 'email',
    placeholder: 'Enter your email',
    autoComplete: 'username',
  },
  {
    label: 'Password',
    name: 'password',
    type: 'password',
    placeholder: 'Enter your password',
    autoComplete: 'current-password',
  },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const email = formData.get('username') as string;
      const password = formData.get('password') as string;

      // 1. Login
      const loginRes = await login(email, password);
      const { access_token } = loginRes.data;

      // 2. Fetch current user (interceptor will attach the token)
      //    We temporarily set the token so the next request can use it
      useAuthStore.setState({ accessToken: access_token });

      const meRes = await getCurrentUser();

      return { access_token, user: meRes.data };
    },
    onSuccess: ({ access_token, user }) => {
      setAuth(access_token, user);
      setError(null);
      navigate('/');
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;

      let message = 'Login failed. Please try again.';

      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        // FastAPI validation errors
        message = detail.map((e) => e.msg).join(', ');
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
      useAuthStore.getState().clearAuth();
    },
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    loginMutation.mutate(formData);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-[#15152a]">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">Welcome Back</h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <Form
          inputs={loginInputs}
          onSubmit={handleSubmit}
          buttonText={loginMutation.isPending ? 'Signing in…' : 'Sign In'}
          // optional: disable the button while loading
          // disabled={loginMutation.isPending}
        />

        <p className="mt-2 text-sm">
          Don't have an account?{' '}
          <button
            type="button"
            className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-purple-700"
            onClick={() => navigate('/register')}
          >
            Sign up
          </button>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;

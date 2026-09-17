import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import Form from '../component/ui/Form';
import type { FormInput } from '../types/form';
import { register } from '@/api/auth';

const registerInputs: FormInput[] = [
  {
    label: 'Username',
    name: 'username',
    type: 'text',
    placeholder: 'Enter your username',
    autoComplete: 'username',
  },
  {
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'Enter your email',
    autoComplete: 'email',
  },
  {
    label: 'Password',
    name: 'password',
    type: 'password',
    placeholder: '••••••••',
    autoComplete: 'new-password',
  },
  {
    label: 'Confirm password',
    name: 'confirmPassword',
    type: 'password',
    placeholder: '••••••••',
    autoComplete: 'new-password',
  },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      // Client-side validation
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Call your backend
      // Adjust the payload to match what your /auth/register expects
      const { data } = await register({
        username, // remove if your API doesn't need it
        email,
        password,
      });

      return data;
    },
    onSuccess: () => {
      setError(null);
      // After successful registration, send the user to login
      navigate('/login');
    },
    onError: (err: any) => {
      // Backend usually returns { detail: "Email already registered" }
      const message =
        err.message || // client-side error (passwords don't match)
        err.response?.data?.detail || // FastAPI error
        'Registration failed. Please try again.';
      setError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    registerMutation.mutate(formData);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-[#15152a]">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">Sign Up</h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <Form
          inputs={registerInputs}
          onSubmit={handleSubmit}
          buttonText={registerMutation.isPending ? 'Creating account…' : 'Sign up'}
        />

        <p className="mt-2 text-sm">
          Already have an account?{' '}
          <button
            type="button"
            className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-purple-700"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
};

export default RegisterPage;

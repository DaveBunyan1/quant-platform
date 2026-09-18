import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schemas';
import Button from '@/component/ui/Button';

const LoginForm = () => {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onError: (error: any) => {
        const message = error?.response?.data?.detail || 'Invalid email or password';

        setError('root', { message });
      },
    });
  };

  const isLoading = loginMutation.isPending || isSubmitting;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-[#15152a]">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">Welcome Back</h2>
        </div>

        {errors.root && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              id="username"
              type="email"
              autoComplete="username"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition duration-200 focus:border-transparent focus:ring-2 focus:ring-gray-200 focus:outline-none dark:border-gray-600 dark:bg-[#1e1e2f]"
              {...register('username')}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition duration-200 focus:border-transparent focus:ring-2 focus:ring-gray-200 focus:outline-none dark:border-gray-600 dark:bg-[#1e1e2f]"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button text={isLoading ? 'Signing in…' : 'Sign In'} disabled={isLoading} />
        </form>

        <p className="mt-2 text-sm">
          Don't have an account?{' '}
          <button
            type="button"
            className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-purple-400"
            onClick={() => navigate('/register')}
          >
            Sign up
          </button>
        </p>
      </div>
    </main>
  );
};

export default LoginForm;

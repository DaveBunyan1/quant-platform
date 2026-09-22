import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useRegister';
import { registerSchema, type RegisterFormValues } from '../schemas/auth.schemas';
import Button from '@/component/ui/Button';
import { isAxiosError } from 'axios';

const RegisterForm = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...payload } = values;

    registerMutation.mutate(payload, {
      onError: (error: unknown) => {
        const message = isAxiosError(error)
          ? (error.response?.data as { detail?: string } | undefined)?.detail
          : undefined;

        const text = message || 'Registration failed. Please try again.';

        if (typeof text === 'string' && text.toLowerCase().includes('email')) {
          setError('email', { message: text });
        } else {
          setError('root', { message: text });
        }
      },
    });
  };

  const isLoading = registerMutation.isPending || isSubmitting;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-[#15152a]">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">Create an account</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Join us today</p>
        </div>

        {errors.root && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition duration-200 focus:border-transparent focus:ring-2 focus:ring-gray-200 focus:outline-none dark:border-gray-600 dark:bg-[#1e1e2f]"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="username"
              autoComplete="username"
              placeholder="Enter your username"
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
              autoComplete="new-password"
              placeholder="Create a password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition duration-200 focus:border-transparent focus:ring-2 focus:ring-gray-200 focus:outline-none dark:border-gray-600 dark:bg-[#1e1e2f]"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition duration-200 focus:border-transparent focus:ring-2 focus:ring-gray-200 focus:outline-none dark:border-gray-600 dark:bg-[#1e1e2f]"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button text={isLoading ? 'Creating account…' : 'Sign Up'} disabled={isLoading} />
        </form>

        <p className="mt-2 text-center text-sm">
          Already have an account?{' '}
          <button
            type="button"
            className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-blue-500"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
};

export default RegisterForm;

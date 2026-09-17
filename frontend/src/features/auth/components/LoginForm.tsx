import Form from '@/component/ui/Form';
import type { FormInput } from '@/types/form';
import { useNavigate } from 'react-router-dom';
import useLogin from '../hooks/useLogin';

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

const LoginForm = () => {
  const navigate = useNavigate();

  const { errorMessage, isPending, mutate } = useLogin();

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutate(formData, {
      onSuccess: () => {
        navigate('/');
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-[#15152a]">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">Welcome Back</h2>
        </div>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <Form
          inputs={loginInputs}
          onSubmit={handleSubmit}
          buttonText={isPending ? 'Signing in…' : 'Sign In'}
          // TODO: Implement disabled on form
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

export default LoginForm;

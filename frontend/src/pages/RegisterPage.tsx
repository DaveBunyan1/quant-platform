import { useNavigate } from 'react-router-dom';
import Form from '../component/ui/Form';
import type { FormInput } from '../types/form';

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
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submitted!');
  };
  return (
    <>
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-[#15152a]">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold">Sign Up</h2>
          </div>

          <Form inputs={registerInputs} onSubmit={handleSubmit} buttonText="Sign up" />

          <p className="mt-2 text-sm">
            Already have an account?{' '}
            <button
              className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-purple-700"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </p>
        </div>
      </main>
    </>
  );
};

export default RegisterPage;

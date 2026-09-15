import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type User } from '../types/user';
import getUser from '../temp/getUser';
import type { FormInput } from '../types/form';
import Form from '../component/ui/Form';

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
  const [user, setUser] = useState<User | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !inputRef.current) {
      return;
    }
    if (inputRef.current.value === user.name) {
      console.log('Names match');
    } else {
      console.log('No match');
    }
  };
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-[#15152a]">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">Welcome Back</h2>
        </div>
        <Form inputs={loginInputs} onSubmit={handleSubmit} buttonText="Sign In" />
        <p className="mt-2 text-sm">
          Don't have an account?{' '}
          <button
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

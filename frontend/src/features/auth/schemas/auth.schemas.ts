import { z } from 'zod';

const MINIMUM_PASSWORD_LENGTH = 4;

export const loginSchema = z.object({
  username: z.email().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.email().min(1, 'Email is required'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(
        MINIMUM_PASSWORD_LENGTH,
        `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters`,
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    username: z.string().min(1, 'Username is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

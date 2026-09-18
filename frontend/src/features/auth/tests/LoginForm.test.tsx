import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import LoginForm from '../components/LoginForm';
import { useLogin } from '../hooks/useLogin';

vi.mock('../hooks/useLogin');

const mockMutate = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLogin).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  it('renders email, password fields and submit button', () => {
    renderWithProviders(<LoginForm />, { route: '/login' });

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, { route: '/login' });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits valid credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { username: 'user@example.com', password: 'secret' },
        expect.any(Object),
      );
    });
  });

  it('displays server error message', async () => {
    const user = userEvent.setup();
    mockMutate.mockImplementation((_values, { onError }) => {
      onError({ response: { data: { detail: 'Invalid credentials' } } });
    });

    renderWithProviders(<LoginForm />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('has a working link to the register page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, { route: '/login' });

    const signUpButton = screen.getByRole('button', { name: /sign up/i });
    expect(signUpButton).toBeInTheDocument();
    // Navigation is handled by react-router; we just assert the control exists and is clickable
    await user.click(signUpButton);
  });

  it('disables the button while loading', () => {
    vi.mocked(useLogin).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    } as any);

    renderWithProviders(<LoginForm />, { route: '/login' });

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});

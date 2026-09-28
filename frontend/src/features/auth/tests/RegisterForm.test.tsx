import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRegister } from '../hooks/useRegister';
import { useNavigate } from 'react-router-dom';
import { AxiosError, type AxiosResponse, AxiosHeaders } from 'axios';
import RegisterForm from '../components/RegisterForm';

// Mock dependencies
vi.mock('../hooks/useRegister', () => ({
  useRegister: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('RegisterForm', () => {
  const mockMutate = vi.fn();
  const mockNavigate = vi.fn();

  const mockUseRegister = (overrides = {}) =>
    ({
      mutate: mockMutate,
      isPending: false,
      ...overrides,
    }) as unknown as ReturnType<typeof useRegister>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useRegister).mockReturnValue(mockUseRegister());
  });

  it('renders all form fields and the submit button', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('submits form with payload excluding confirmPassword when valid', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/username/i), 'johndoe');
    await user.type(screen.getByLabelText(/^password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          email: 'user@example.com',
          username: 'johndoe',
          password: 'Password123!',
        },
        expect.objectContaining({
          onError: expect.any(Function),
        }),
      );
    });
  });

  it('sets error on the email field when the server error contains "email"', async () => {
    const user = userEvent.setup();

    // Capture the onError callback passed to mutate
    mockMutate.mockImplementation((_payload, options) => {
      const mockAxiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, {}, {
        data: { detail: 'Email is already taken' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      } as AxiosResponse);

      options?.onError?.(mockAxiosError);
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/username/i), 'johndoe');
    await user.type(screen.getByLabelText(/^password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is already taken/i)).toBeInTheDocument();
    });
  });

  it('sets root error message when server error does not contain "email"', async () => {
    const user = userEvent.setup();

    mockMutate.mockImplementation((_payload, options) => {
      const mockAxiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, {}, {
        data: { detail: 'Internal Server Error' },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: { headers: new AxiosHeaders() },
      } as AxiosResponse);

      options?.onError?.(mockAxiosError);
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/username/i), 'johndoe');
    await user.type(screen.getByLabelText(/^password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  it('navigates to /login when clicking the "Sign in" link', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('disables the submit button and displays loading text while pending', () => {
    vi.mocked(useRegister).mockReturnValue(mockUseRegister({ isPending: true }));

    render(<RegisterForm />);

    const button = screen.getByRole('button', { name: /creating account…/i });
    expect(button).toBeDisabled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import RegisterForm from '../components/RegisterForm';
import { useRegister } from '../hooks/useRegister';

vi.mock('../hooks/useRegister');

const mockMutate = vi.fn();

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRegister).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  it('renders all fields', () => {
    renderWithProviders(<RegisterForm />, { route: '/register' });

    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />, { route: '/register' });

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    // At least some required-field messages should appear
    expect(await screen.findAllByText(/required/i)).not.toHaveLength(0);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />, { route: '/register' });

    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com');
    await user.type(screen.getByLabelText(/username/i), 'dave');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits valid data (without confirmPassword)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />, { route: '/register' });

    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com');
    await user.type(screen.getByLabelText(/username/i), 'dave');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          email: 'user@example.com',
          username: 'dave',
          password: 'secret',
        },
        expect.any(Object),
      );
    });
  });

  it('displays server-side email error on the email field', async () => {
    const user = userEvent.setup();
    mockMutate.mockImplementation((_values, { onError }) => {
      onError({ response: { data: { detail: 'Email already registered' } } });
    });

    renderWithProviders(<RegisterForm />, { route: '/register' });

    await user.type(screen.getByLabelText(/^email$/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/username/i), 'dave');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
  });
});

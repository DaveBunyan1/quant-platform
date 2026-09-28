import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLogout } from '../hooks/useLogout';
import LogoutButton from '../components/LogoutButton';

// Mock the custom hook
vi.mock('../hooks/useLogout', () => ({
  useLogout: vi.fn(),
}));

describe('LogoutButton', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the default "Sign out" state correctly', () => {
    vi.mocked(useLogout).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>);

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('triggers the mutate function when clicked', () => {
    vi.mocked(useLogout).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>);

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(button);

    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('displays loading state and is disabled while mutation is pending', () => {
    vi.mocked(useLogout).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    } as unknown as ReturnType<typeof useLogout>);

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /signing out/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('prevents multiple clicks when pending', () => {
    vi.mocked(useLogout).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    } as unknown as ReturnType<typeof useLogout>);

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /signing out/i });
    fireEvent.click(button);

    // Should not call mutate because disabled button prevents handler trigger
    expect(mockMutate).not.toHaveBeenCalled();
  });
});

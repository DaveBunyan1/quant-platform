import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/test-utils';
import PrivateRoutes from './PrivateRoutes';
import { useAuth } from '@/features/auth/hooks/useAuth';

vi.mock('@/features/auth/hooks/useAuth');

describe('PrivateRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: undefined,
      isFetching: false,
    });

    renderWithProviders(
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
  });

  it('renders child routes when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'a@b.com', username: 'dave' },
      isFetching: false,
    });

    renderWithProviders(
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    );

    expect(screen.getByText(/protected content/i)).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      isFetching: false,
    });

    renderWithProviders(
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { route: '/' },
    );

    expect(screen.getByText(/login page/i)).toBeInTheDocument();
    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
  });
});

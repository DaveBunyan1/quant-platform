import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/test-utils';
import PublicRoutes from './PublicRoutes';
import { useAuth } from '@/features/auth/hooks/useAuth';

vi.mock('@/features/auth/hooks/useAuth');

describe('PublicRoutes', () => {
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
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<div>Login Form</div>} />
        </Route>
      </Routes>,
      { route: '/login' },
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders public content when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      isFetching: false,
    });

    renderWithProviders(
      <Routes>
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<div>Login Form</div>} />
        </Route>
      </Routes>,
      { route: '/login' },
    );

    expect(screen.getByText(/login form/i)).toBeInTheDocument();
  });

  it('redirects authenticated users away from public routes', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'a@b.com', username: 'dave' },
      isFetching: false,
    });

    renderWithProviders(
      <Routes>
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<div>Login Form</div>} />
        </Route>
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>,
      { route: '/login' },
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/login form/i)).not.toBeInTheDocument();
  });
});

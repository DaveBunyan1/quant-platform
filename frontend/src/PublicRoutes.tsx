import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './features/auth/hooks/useAuth';

const PublicRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // Already logged in → redirect away from login/register
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoutes;

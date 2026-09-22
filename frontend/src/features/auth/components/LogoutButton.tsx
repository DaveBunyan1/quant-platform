import { useLogout } from '../hooks/useLogout';

const LogoutButton = () => {
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
      className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
    </button>
  );
};

export default LogoutButton;

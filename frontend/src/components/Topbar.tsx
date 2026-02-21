import { Button } from './ui/Button';
import { authService } from '../services/auth';
import { useAuthStore } from '../store/auth.store';

export const Topbar = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors during logout cleanup.
    } finally {
      logout();
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur">
      <p className="text-sm text-slate-500">Real-time fleet command center</p>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
};

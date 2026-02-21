import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { defaultRouteByRole } from '../lib/navigation';
import type { Role } from '../types';

export const RequireAuth = () => {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

export const RequireRoles = ({ roles }: { roles: Role[] }) => {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={defaultRouteByRole[user.role]} replace />;
  }
  return <Outlet />;
};

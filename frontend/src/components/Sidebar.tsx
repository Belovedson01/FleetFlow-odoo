import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { Role } from '../types';

const navItems: Array<{ to: string; label: string; roles: Role[] }> = [
  { to: '/dashboard', label: 'Dashboard', roles: ['MANAGER', 'DISPATCHER', 'SAFETY'] },
  { to: '/vehicles', label: 'Vehicle Registry', roles: ['MANAGER', 'DISPATCHER', 'SAFETY'] },
  { to: '/trips', label: 'Trip Dispatcher', roles: ['MANAGER', 'DISPATCHER', 'SAFETY'] },
  { to: '/maintenance', label: 'Maintenance Logs', roles: ['MANAGER', 'DISPATCHER', 'SAFETY'] },
  { to: '/fuel', label: 'Fuel Logs', roles: ['MANAGER', 'DISPATCHER', 'SAFETY'] },
  { to: '/drivers', label: 'Driver Profiles', roles: ['MANAGER', 'DISPATCHER', 'SAFETY'] },
  { to: '/analytics', label: 'Analytics', roles: ['MANAGER', 'ANALYST'] }
];

export const Sidebar = () => {
  const user = useAuthStore((s) => s.user);
  const visibleItems = navItems.filter((item) => (user ? item.roles.includes(user.role) : false));

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white/90 px-4 py-4 md:w-64 md:border-b-0 md:border-r md:py-6">
      <h1 className="mb-3 text-xl font-bold text-brand-700 md:mb-6">FleetFlow</h1>
      <nav className="flex gap-2 overflow-auto md:block md:space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-100 text-brand-800' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth, RequireRoles } from './components/RouteGuards';
import { defaultRouteByRole } from './lib/navigation';
import { AppLayout } from './layouts/AppLayout';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DriversPage } from './pages/DriversPage';
import { FuelLogsPage } from './pages/FuelLogsPage';
import { LoginPage } from './pages/LoginPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { TripsPage } from './pages/TripsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { useAuthStore } from './store/auth.store';

const HomeRedirect = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={defaultRouteByRole[user.role]} replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          {
            element: <RequireRoles roles={['MANAGER', 'DISPATCHER', 'SAFETY']} />,
            children: [
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'vehicles', element: <VehiclesPage /> },
              { path: 'trips', element: <TripsPage /> },
              { path: 'maintenance', element: <MaintenancePage /> },
              { path: 'fuel', element: <FuelLogsPage /> },
              { path: 'drivers', element: <DriversPage /> }
            ]
          },
          {
            element: <RequireRoles roles={['MANAGER', 'ANALYST']} />,
            children: [{ path: 'analytics', element: <AnalyticsPage /> }]
          }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> }
]);

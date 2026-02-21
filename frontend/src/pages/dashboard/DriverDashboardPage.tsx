import { Card } from '../../components/ui/Card';

export const DriverDashboardPage = () => {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-800">Welcome, Driver</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your account is active with driver-level access. Contact your fleet manager for elevated permissions.
      </p>
    </Card>
  );
};

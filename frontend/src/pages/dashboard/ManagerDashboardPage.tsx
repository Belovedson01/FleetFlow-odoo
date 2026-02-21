import { Card } from '../../components/ui/Card';

export const ManagerDashboardPage = () => {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-800">Welcome, Manager</h1>
      <p className="mt-2 text-sm text-slate-600">
        You are in the manager dashboard. Fleet-level command tools are available from the sidebar.
      </p>
    </Card>
  );
};

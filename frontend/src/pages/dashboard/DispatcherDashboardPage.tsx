import { Card } from '../../components/ui/Card';

export const DispatcherDashboardPage = () => {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-800">Welcome, Dispatcher</h1>
      <p className="mt-2 text-sm text-slate-600">
        You are in the dispatcher dashboard. Use trip planning and allocation modules to operate live
        dispatch.
      </p>
    </Card>
  );
};

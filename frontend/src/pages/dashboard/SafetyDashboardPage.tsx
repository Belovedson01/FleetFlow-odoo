import { Card } from '../../components/ui/Card';

export const SafetyDashboardPage = () => {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-800">Welcome, Safety</h1>
      <p className="mt-2 text-sm text-slate-600">
        You are in the safety dashboard. Track compliance, license expiry and driver safety trends.
      </p>
    </Card>
  );
};

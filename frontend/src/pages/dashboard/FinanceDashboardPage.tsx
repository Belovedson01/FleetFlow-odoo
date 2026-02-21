import { Card } from '../../components/ui/Card';

export const FinanceDashboardPage = () => {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-800">Welcome, Analyst</h1>
      <p className="mt-2 text-sm text-slate-600">
        You are in the finance dashboard. Review ROI, fuel cost and profitability analytics.
      </p>
    </Card>
  );
};

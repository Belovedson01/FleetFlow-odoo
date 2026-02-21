import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/ui/Card';
import { money } from '../../lib/format';
import { dashboardService } from '../../services/dashboard';
import { useRealtimeStore } from '../../store/realtime.store';
import type { FinanceDashboardResponse } from '../../types';

const kpiCard = (title: string, value: string | number) => (
  <Card className="bg-gradient-to-br from-white to-brand-50">
    <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
  </Card>
);

export const FinanceDashboardPage = () => {
  const tick = useRealtimeStore((s) => s.tick);
  const [data, setData] = useState<FinanceDashboardResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService
      .finance()
      .then((res) => {
        setData(res);
        setError('');
      })
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load finance dashboard'));
  }, [tick]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading finance dashboard...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpiCard('Total Revenue', money(data.totalRevenue))}
        {kpiCard('Total Expense', money(data.totalExpense))}
        {kpiCard('Net Profit', money(data.netProfit))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Revenue vs Expense">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#16a34a" />
                <Bar dataKey="expense" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Revenue Trend (30 days)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueLast30Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/ui/Card';
import { dashboardService } from '../../services/dashboard';
import { useRealtimeStore } from '../../store/realtime.store';
import type { DispatcherDashboardResponse } from '../../types';

const kpiCard = (title: string, value: string | number, tone: 'default' | 'danger' = 'default') => (
  <Card className={tone === 'danger' ? 'border-rose-200 bg-rose-50' : 'bg-gradient-to-br from-white to-brand-50'}>
    <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
    <p className={`mt-2 text-2xl font-bold ${tone === 'danger' ? 'text-rose-700' : 'text-slate-800'}`}>{value}</p>
  </Card>
);

export const DispatcherDashboardPage = () => {
  const tick = useRealtimeStore((s) => s.tick);
  const [data, setData] = useState<DispatcherDashboardResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService
      .dispatcher()
      .then((res) => {
        setData(res);
        setError('');
      })
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load dispatcher dashboard'));
  }, [tick]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading dispatcher dashboard...</p>;
  }

  const chartData = [
    { label: 'Pending', value: data.pendingTrips },
    { label: 'Assigned', value: data.assignedTrips },
    { label: 'In Progress', value: data.inProgressTrips },
    { label: 'Delayed', value: data.delayedTrips }
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpiCard('Pending Trips', data.pendingTrips)}
        {kpiCard('Assigned Trips', data.assignedTrips)}
        {kpiCard('Trips In Progress', data.inProgressTrips)}
        {kpiCard('Delayed Trips', data.delayedTrips, 'danger')}
        {kpiCard('Available Drivers', data.availableDrivers)}
      </div>

      <Card title="Trip Operations Snapshot">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

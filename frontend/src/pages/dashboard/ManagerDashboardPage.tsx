import { useEffect, useState } from 'react';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/ui/Card';
import { dashboardService } from '../../services/dashboard';
import { useRealtimeStore } from '../../store/realtime.store';
import type { ManagerDashboardResponse } from '../../types';

const colors = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444'];

const kpiCard = (title: string, value: string | number) => (
  <Card className="bg-gradient-to-br from-white to-brand-50">
    <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
  </Card>
);

export const ManagerDashboardPage = () => {
  const tick = useRealtimeStore((s) => s.tick);
  const [data, setData] = useState<ManagerDashboardResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService
      .manager()
      .then((res) => {
        setData(res);
        setError('');
      })
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load manager dashboard'));
  }, [tick]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading manager dashboard...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCard('Total Vehicles', data.totalVehicles)}
        {kpiCard('Active Vehicles', data.activeVehicles)}
        {kpiCard('Total Drivers', data.totalDrivers)}
        {kpiCard('Active Trips', data.activeTrips)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`Fleet Utilization ${data.utilizationPercentage.toFixed(1)}%`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueLast7Days}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Trip Status Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.tripStatusDistribution}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={88}
                  label={(item) => item.status}
                >
                  {data.tripStatusDistribution.map((entry, index) => (
                    <Cell key={entry.status} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

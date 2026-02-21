import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../components/ui/Card';
import { money } from '../lib/format';
import { analyticsService } from '../services/analytics';
import { useRealtimeStore } from '../store/realtime.store';
import type { DashboardResponse } from '../types';

const kpiCard = (title: string, value: string | number) => (
  <Card className="bg-gradient-to-br from-white to-brand-50">
    <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
  </Card>
);

export const DashboardPage = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState('');
  const tick = useRealtimeStore((s) => s.tick);

  useEffect(() => {
    analyticsService
      .dashboard()
      .then(setData)
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load dashboard'));
  }, [tick]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCard('Active Fleet', data.kpis.activeFleetCount)}
        {kpiCard('Maintenance Alerts', data.kpis.maintenanceAlerts)}
        {kpiCard('Utilization', `${data.kpis.utilizationPct.toFixed(1)}%`)}
        {kpiCard('Pending Trips', data.kpis.pendingTrips)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Fuel Efficiency Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.fuelEfficiencyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line dataKey="kmPerLiter" stroke="#177f4f" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Monthly Revenue">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#229f63" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Top 5 Costliest Vehicles">
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Fuel Cost</th>
                <th className="px-3 py-2">Maintenance</th>
                <th className="px-3 py-2">Operational Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.topCostliestVehicles.map((row) => (
                <tr key={row.vehicleId} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    {row.vehicleName} ({row.licensePlate})
                  </td>
                  <td className="px-3 py-2">{money(row.fuelCost)}</td>
                  <td className="px-3 py-2">{money(row.maintenanceCost)}</td>
                  <td className="px-3 py-2 font-semibold">{money(row.totalOperationalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

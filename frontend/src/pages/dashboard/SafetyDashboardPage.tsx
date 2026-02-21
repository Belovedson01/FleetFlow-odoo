import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { dashboardService } from '../../services/dashboard';
import { useRealtimeStore } from '../../store/realtime.store';
import type { SafetyDashboardResponse } from '../../types';

const kpiCard = (title: string, value: string | number, tone: 'default' | 'warning' | 'danger' = 'default') => (
  <Card
    className={
      tone === 'danger'
        ? 'border-rose-200 bg-rose-50'
        : tone === 'warning'
          ? 'border-amber-200 bg-amber-50'
          : 'bg-gradient-to-br from-white to-brand-50'
    }
  >
    <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
    <p
      className={`mt-2 text-2xl font-bold ${
        tone === 'danger' ? 'text-rose-700' : tone === 'warning' ? 'text-amber-700' : 'text-slate-800'
      }`}
    >
      {value}
    </p>
  </Card>
);

export const SafetyDashboardPage = () => {
  const tick = useRealtimeStore((s) => s.tick);
  const [data, setData] = useState<SafetyDashboardResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService
      .safety()
      .then((res) => {
        setData(res);
        setError('');
      })
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load safety dashboard'));
  }, [tick]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading safety dashboard...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCard('Vehicles In Maintenance', data.vehiclesInMaintenance, 'warning')}
        {kpiCard('Delayed Trips', data.delayedTrips, 'danger')}
        {kpiCard('Incident Reports', data.incidentCount, 'danger')}
        {kpiCard('Compliance Alerts', data.complianceAlerts, 'warning')}
      </div>

      <Card title="Risk Monitoring">
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-rose-700">High Risk:</span> {data.delayedTrips} delayed or
            cancelled trips require immediate review.
          </p>
          <p>
            <span className="font-semibold text-amber-700">Compliance Watch:</span> {data.complianceAlerts} driver
            licenses are expired or nearing expiry.
          </p>
          <p>
            <span className="font-semibold text-slate-800">Maintenance Queue:</span> {data.vehiclesInMaintenance}{' '}
            vehicles are currently unavailable due to service.
          </p>
        </div>
      </Card>
    </div>
  );
};

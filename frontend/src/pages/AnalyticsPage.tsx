import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { money, percent } from '../lib/format';
import { analyticsService } from '../services/analytics';
import { useRealtimeStore } from '../store/realtime.store';
import type { AnalyticsResponse } from '../types';

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const AnalyticsPage = () => {
  const tick = useRealtimeStore((s) => s.tick);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    analyticsService
      .reports()
      .then(setData)
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load analytics'));
  }, [tick]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading analytics...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Operational Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => analyticsService.exportCsv().then((blob) => downloadBlob(blob, 'fleetflow-analytics.csv'))}>
            Export CSV
          </Button>
          <Button onClick={() => analyticsService.exportPdf().then((blob) => downloadBlob(blob, 'fleetflow-analytics.pdf'))}>
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total Operational Cost">
          <p className="text-2xl font-bold">{money(data.kpis.totalOperationalCost)}</p>
        </Card>
        <Card title="Fleet ROI">
          <p className="text-2xl font-bold">{percent(data.kpis.fleetRoi)}</p>
        </Card>
        <Card title="Fleet Fuel Efficiency">
          <p className="text-2xl font-bold">{data.kpis.fleetFuelEfficiency.toFixed(2)} km/l</p>
        </Card>
      </div>

      <Card title="ROI by Vehicle">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.vehicles}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicleName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="roi" fill="#177f4f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Vehicle KPI Table">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Revenue</th>
                <th className="px-3 py-2">Fuel Cost</th>
                <th className="px-3 py-2">Maintenance</th>
                <th className="px-3 py-2">Total Cost</th>
                <th className="px-3 py-2">Fuel Efficiency</th>
                <th className="px-3 py-2">ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.vehicles.map((row) => (
                <tr key={row.vehicleId} className="border-t border-slate-100">
                  <td className="px-3 py-2">{row.vehicleName}</td>
                  <td className="px-3 py-2">{money(row.revenue)}</td>
                  <td className="px-3 py-2">{money(row.fuelCost)}</td>
                  <td className="px-3 py-2">{money(row.maintenanceCost)}</td>
                  <td className="px-3 py-2">{money(row.totalOperationalCost)}</td>
                  <td className="px-3 py-2">{row.fuelEfficiency.toFixed(2)} km/l</td>
                  <td className="px-3 py-2">{percent(row.roi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

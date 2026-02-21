import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { shortDate } from '../lib/format';
import { driverService } from '../services/drivers';
import { useAuthStore } from '../store/auth.store';
import { useRealtimeStore } from '../store/realtime.store';
import type { Driver, DriverStatus } from '../types';

const schema = z.object({
  name: z.string().min(2),
  licenseNumber: z.string().min(3),
  licenseCategory: z.string().min(1),
  licenseExpiry: z.string().min(1),
  status: z.enum(['ON_DUTY', 'OFF_DUTY', 'SUSPENDED', 'ON_TRIP']).default('ON_DUTY'),
  safetyScore: z.coerce.number().min(0).max(100).default(100)
});

type FormValues = z.infer<typeof schema>;

const isLicenseNearExpiry = (dateString: string) => {
  const expiry = new Date(dateString).getTime();
  const today = Date.now();
  const diffDays = (expiry - today) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
};

export const DriversPage = () => {
  const user = useAuthStore((s) => s.user);
  const tick = useRealtimeStore((s) => s.tick);
  const canCreate = user?.role === 'MANAGER' || user?.role === 'SAFETY';
  const canComplianceUpdate = user?.role === 'SAFETY';

  const [rows, setRows] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      licenseNumber: '',
      licenseCategory: '',
      licenseExpiry: new Date().toISOString().slice(0, 10),
      status: 'ON_DUTY',
      safetyScore: 100
    }
  });

  const load = () =>
    driverService
      .list()
      .then(setRows)
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load drivers'));

  useEffect(() => {
    load();
  }, [tick]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter((row) =>
      [row.name, row.licenseNumber, row.status, row.licenseCategory].join(' ').toLowerCase().includes(term)
    );
  }, [rows, search]);

  const updateStatus = async (id: number, status: DriverStatus) => {
    await driverService.updateCompliance(id, { status });
    load();
  };

  const columns = useMemo<ColumnDef<Driver>[]>(
    () => [
      { header: 'Driver', accessorKey: 'name' },
      { header: 'License #', accessorKey: 'licenseNumber' },
      { header: 'Category', accessorKey: 'licenseCategory' },
      {
        header: 'Expiry',
        cell: ({ row }) => (
          <span className={isLicenseNearExpiry(row.original.licenseExpiry) ? 'font-semibold text-rose-600' : ''}>
            {shortDate(row.original.licenseExpiry)}
          </span>
        )
      },
      { header: 'Safety Score', cell: ({ row }) => row.original.safetyScore.toFixed(1) },
      { header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        header: 'Actions',
        cell: ({ row }) =>
          canComplianceUpdate ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => updateStatus(row.original.id, 'ON_DUTY')}>
                On Duty
              </Button>
              <Button variant="danger" onClick={() => updateStatus(row.original.id, 'SUSPENDED')}>
                Suspend
              </Button>
            </div>
          ) : null
      }
    ],
    [canComplianceUpdate]
  );

  const submit = form.handleSubmit(async (values) => {
    await driverService.create(values);
    form.reset({
      name: '',
      licenseNumber: '',
      licenseCategory: '',
      licenseExpiry: new Date().toISOString().slice(0, 10),
      status: 'ON_DUTY',
      safetyScore: 100
    });
    load();
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Driver Profiles</h2>
      {canCreate ? (
        <Card title="Add Driver">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
            <Input placeholder="Name" {...form.register('name')} />
            <Input placeholder="License Number" {...form.register('licenseNumber')} />
            <Input placeholder="License Category" {...form.register('licenseCategory')} />
            <Input type="date" {...form.register('licenseExpiry')} />
            <Select {...form.register('status')}>
              <option value="ON_DUTY">ON_DUTY</option>
              <option value="OFF_DUTY">OFF_DUTY</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="ON_TRIP">ON_TRIP</option>
            </Select>
            <Input type="number" step="0.1" placeholder="Safety Score" {...form.register('safetyScore')} />
            <div className="md:col-span-2">
              <Button type="submit">Create Driver</Button>
            </div>
          </form>
        </Card>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <DataTable columns={columns} data={filtered} search={search} onSearch={setSearch} />
    </div>
  );
};

import { cn } from '../../lib/cn';
import type { DriverStatus, TripStatus, VehicleStatus } from '../../types';

type Status = DriverStatus | TripStatus | VehicleStatus;

const colors: Record<Status, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800',
  ON_TRIP: 'bg-sky-100 text-sky-800',
  IN_SHOP: 'bg-amber-100 text-amber-800',
  RETIRED: 'bg-slate-200 text-slate-700',
  ON_DUTY: 'bg-emerald-100 text-emerald-800',
  OFF_DUTY: 'bg-slate-200 text-slate-700',
  SUSPENDED: 'bg-rose-100 text-rose-700',
  DRAFT: 'bg-slate-100 text-slate-700',
  DISPATCHED: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700'
};

export const StatusBadge = ({ status }: { status: Status }) => (
  <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-semibold', colors[status])}>
    {status.replace('_', ' ')}
  </span>
);

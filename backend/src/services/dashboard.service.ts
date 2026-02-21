import { DriverStatus, TripStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../prisma/client';

const dayKey = (date: Date) => date.toISOString().slice(0, 10);
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const dayLabel = (key: string) =>
  new Date(`${key}T00:00:00.000Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const lastDayKeys = (days: number) => {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
};

const lastMonthKeys = (months: number) => {
  const keys: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
};

const toStatusMap = (rows: Array<{ status: TripStatus; _count: { _all: number } }>) => {
  const map = new Map<TripStatus, number>();
  rows.forEach((row) => map.set(row.status, row._count._all));
  return map;
};

export const getManagerDashboardData = async () => {
  const since7Days = new Date();
  since7Days.setDate(since7Days.getDate() - 6);
  since7Days.setHours(0, 0, 0, 0);

  const [totalVehicles, activeVehicles, totalDrivers, activeTrips, statusCounts, completedRevenueRows] =
    await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({
        where: {
          status: {
            in: [VehicleStatus.AVAILABLE, VehicleStatus.ON_TRIP]
          }
        }
      }),
      prisma.driver.count(),
      prisma.trip.count({
        where: {
          status: {
            in: [TripStatus.DISPATCHED]
          }
        }
      }),
      prisma.trip.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      }),
      prisma.trip.findMany({
        where: {
          status: TripStatus.COMPLETED,
          createdAt: { gte: since7Days }
        },
        select: {
          createdAt: true,
          revenue: true
        }
      })
    ]);

  const revenueByDay = new Map<string, number>();
  completedRevenueRows.forEach((row) => {
    const key = dayKey(row.createdAt);
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + row.revenue);
  });

  const revenueLast7Days = lastDayKeys(7).map((key) => ({
    day: dayLabel(key),
    revenue: Number((revenueByDay.get(key) || 0).toFixed(2))
  }));

  const groupedStatusCounts = toStatusMap(statusCounts);
  const tripStatusDistribution = [
    { status: TripStatus.DRAFT, count: groupedStatusCounts.get(TripStatus.DRAFT) || 0 },
    { status: TripStatus.DISPATCHED, count: groupedStatusCounts.get(TripStatus.DISPATCHED) || 0 },
    { status: TripStatus.COMPLETED, count: groupedStatusCounts.get(TripStatus.COMPLETED) || 0 },
    { status: TripStatus.CANCELLED, count: groupedStatusCounts.get(TripStatus.CANCELLED) || 0 }
  ];

  return {
    totalVehicles,
    activeVehicles,
    totalDrivers,
    activeTrips,
    utilizationPercentage: Number((totalVehicles ? (activeVehicles / totalVehicles) * 100 : 0).toFixed(2)),
    revenueLast7Days,
    tripStatusDistribution
  };
};

export const getDispatcherDashboardData = async () => {
  const [statusCounts, availableDrivers] = await Promise.all([
    prisma.trip.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    }),
    prisma.driver.count({
      where: {
        status: DriverStatus.ON_DUTY
      }
    })
  ]);

  const groupedStatusCounts = toStatusMap(statusCounts);
  const pendingTrips = groupedStatusCounts.get(TripStatus.DRAFT) || 0;
  const assignedTrips = groupedStatusCounts.get(TripStatus.DISPATCHED) || 0;
  const inProgressTrips = assignedTrips;
  const delayedTrips = groupedStatusCounts.get(TripStatus.CANCELLED) || 0;

  return {
    pendingTrips,
    assignedTrips,
    inProgressTrips,
    delayedTrips,
    availableDrivers
  };
};

export const getSafetyDashboardData = async () => {
  const licenseAlertDate = new Date();
  licenseAlertDate.setDate(licenseAlertDate.getDate() + 30);

  const [vehiclesInMaintenance, cancelledTrips, complianceAlerts] = await Promise.all([
    prisma.vehicle.count({
      where: {
        status: VehicleStatus.IN_SHOP
      }
    }),
    prisma.trip.count({
      where: {
        status: TripStatus.CANCELLED
      }
    }),
    prisma.driver.count({
      where: {
        OR: [{ licenseExpiry: { lt: new Date() } }, { licenseExpiry: { gte: new Date(), lte: licenseAlertDate } }]
      }
    })
  ]);

  return {
    vehiclesInMaintenance,
    delayedTrips: cancelledTrips,
    incidentCount: cancelledTrips,
    complianceAlerts
  };
};

export const getFinanceDashboardData = async () => {
  const since30Days = new Date();
  since30Days.setDate(since30Days.getDate() - 29);
  since30Days.setHours(0, 0, 0, 0);

  const [
    completedRevenueSum,
    fuelCostSum,
    serviceCostSum,
    revenueRows30Days,
    revenueRowsMonthly,
    fuelRowsMonthly,
    serviceRowsMonthly
  ] = await Promise.all([
    prisma.trip.aggregate({
      where: { status: TripStatus.COMPLETED },
      _sum: { revenue: true }
    }),
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.serviceLog.aggregate({ _sum: { cost: true } }),
    prisma.trip.findMany({
      where: {
        status: TripStatus.COMPLETED,
        createdAt: { gte: since30Days }
      },
      select: {
        createdAt: true,
        revenue: true
      }
    }),
    prisma.trip.findMany({
      where: { status: TripStatus.COMPLETED },
      select: {
        createdAt: true,
        revenue: true
      }
    }),
    prisma.fuelLog.findMany({
      select: {
        date: true,
        cost: true
      }
    }),
    prisma.serviceLog.findMany({
      select: {
        date: true,
        cost: true
      }
    })
  ]);

  const totalRevenue = Number((completedRevenueSum._sum.revenue || 0).toFixed(2));
  const totalExpense = Number(((fuelCostSum._sum.cost || 0) + (serviceCostSum._sum.cost || 0)).toFixed(2));
  const netProfit = Number((totalRevenue - totalExpense).toFixed(2));

  const revenueByDay = new Map<string, number>();
  revenueRows30Days.forEach((row) => {
    const key = dayKey(row.createdAt);
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + row.revenue);
  });
  const revenueLast30Days = lastDayKeys(30).map((key) => ({
    day: dayLabel(key),
    revenue: Number((revenueByDay.get(key) || 0).toFixed(2))
  }));

  const months = lastMonthKeys(6);
  const revenueByMonth = new Map<string, number>();
  revenueRowsMonthly.forEach((row) => {
    const key = monthKey(row.createdAt);
    revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + row.revenue);
  });
  const expenseByMonth = new Map<string, number>();
  fuelRowsMonthly.forEach((row) => {
    const key = monthKey(row.date);
    expenseByMonth.set(key, (expenseByMonth.get(key) || 0) + row.cost);
  });
  serviceRowsMonthly.forEach((row) => {
    const key = monthKey(row.date);
    expenseByMonth.set(key, (expenseByMonth.get(key) || 0) + row.cost);
  });

  const monthlyBreakdown = months.map((key) => ({
    month: monthLabel(key),
    revenue: Number((revenueByMonth.get(key) || 0).toFixed(2)),
    expense: Number((expenseByMonth.get(key) || 0).toFixed(2))
  }));

  return {
    totalRevenue,
    totalExpense,
    netProfit,
    revenueLast30Days,
    monthlyBreakdown
  };
};

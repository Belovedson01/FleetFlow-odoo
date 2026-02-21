import { TripStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../prisma/client';

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
};

const getLastMonthKeys = (months: number) => {
  const result: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(monthKey(d));
  }
  return result;
};

export const getVehicleOperationalMetrics = async () => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: { where: { status: TripStatus.COMPLETED } },
      fuelLogs: true,
      serviceLogs: true
    }
  });

  return vehicles.map((vehicle) => {
    const maintenance = vehicle.serviceLogs.reduce((acc, row) => acc + row.cost, 0);
    const fuel = vehicle.fuelLogs.reduce((acc, row) => acc + row.cost, 0);
    const liters = vehicle.fuelLogs.reduce((acc, row) => acc + row.liters, 0);
    const revenue = vehicle.trips.reduce((acc, row) => acc + row.revenue, 0);
    const distance = vehicle.trips.reduce((acc, row) => {
      if (row.startOdometer == null || row.endOdometer == null) {
        return acc;
      }
      return acc + Math.max(0, row.endOdometer - row.startOdometer);
    }, 0);
    const totalOperationalCost = maintenance + fuel;
    const fuelEfficiency = liters > 0 ? distance / liters : 0;
    const roi =
      vehicle.acquisitionCost > 0
        ? (revenue - totalOperationalCost) / vehicle.acquisitionCost
        : 0;

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      licensePlate: vehicle.licensePlate,
      revenue: Number(revenue.toFixed(2)),
      maintenanceCost: Number(maintenance.toFixed(2)),
      fuelCost: Number(fuel.toFixed(2)),
      totalOperationalCost: Number(totalOperationalCost.toFixed(2)),
      distance: Number(distance.toFixed(2)),
      liters: Number(liters.toFixed(2)),
      fuelEfficiency: Number(fuelEfficiency.toFixed(2)),
      roi: Number(roi.toFixed(4))
    };
  });
};

export const getDashboardData = async () => {
  const [activeFleetCount, maintenanceAlerts, onTripCount, pendingTrips, metrics] = await Promise.all([
    prisma.vehicle.count({
      where: {
        status: { not: VehicleStatus.RETIRED }
      }
    }),
    prisma.vehicle.count({ where: { status: VehicleStatus.IN_SHOP } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.ON_TRIP } }),
    prisma.trip.count({
      where: {
        status: { in: [TripStatus.DRAFT, TripStatus.DISPATCHED] }
      }
    }),
    getVehicleOperationalMetrics()
  ]);

  const utilizationPct = activeFleetCount > 0 ? (onTripCount / activeFleetCount) * 100 : 0;
  const topCostliestVehicles = [...metrics]
    .sort((a, b) => b.totalOperationalCost - a.totalOperationalCost)
    .slice(0, 5);

  const months = getLastMonthKeys(6);
  const revenueTrips = await prisma.trip.findMany({
    where: { status: TripStatus.COMPLETED },
    select: { createdAt: true, revenue: true }
  });
  const fuelLogs = await prisma.fuelLog.findMany({
    select: { date: true, liters: true }
  });
  const completedTrips = await prisma.trip.findMany({
    where: { status: TripStatus.COMPLETED },
    select: { createdAt: true, startOdometer: true, endOdometer: true }
  });

  const revenueByMonth = new Map<string, number>();
  revenueTrips.forEach((row) => {
    const key = monthKey(row.createdAt);
    revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + row.revenue);
  });

  const litersByMonth = new Map<string, number>();
  fuelLogs.forEach((row) => {
    const key = monthKey(row.date);
    litersByMonth.set(key, (litersByMonth.get(key) || 0) + row.liters);
  });

  const distanceByMonth = new Map<string, number>();
  completedTrips.forEach((row) => {
    const key = monthKey(row.createdAt);
    if (row.startOdometer == null || row.endOdometer == null) {
      return;
    }
    distanceByMonth.set(key, (distanceByMonth.get(key) || 0) + (row.endOdometer - row.startOdometer));
  });

  const monthlyRevenue = months.map((key) => ({
    month: monthLabel(key),
    revenue: Number((revenueByMonth.get(key) || 0).toFixed(2))
  }));

  const fuelEfficiencyTrend = months.map((key) => {
    const distance = distanceByMonth.get(key) || 0;
    const liters = litersByMonth.get(key) || 0;
    return {
      month: monthLabel(key),
      kmPerLiter: Number((liters > 0 ? distance / liters : 0).toFixed(2))
    };
  });

  return {
    kpis: {
      activeFleetCount,
      maintenanceAlerts,
      utilizationPct: Number(utilizationPct.toFixed(2)),
      pendingTrips
    },
    monthlyRevenue,
    fuelEfficiencyTrend,
    topCostliestVehicles
  };
};

export const getAnalyticsData = async () => {
  const vehicleMetrics = await getVehicleOperationalMetrics();
  const totalOperationalCost = vehicleMetrics.reduce((acc, row) => acc + row.totalOperationalCost, 0);
  const avgRoi = vehicleMetrics.length
    ? vehicleMetrics.reduce((acc, row) => acc + row.roi, 0) / vehicleMetrics.length
    : 0;
  const fleetFuelEfficiency = vehicleMetrics.reduce((acc, row) => acc + row.fuelEfficiency, 0);

  return {
    kpis: {
      totalOperationalCost: Number(totalOperationalCost.toFixed(2)),
      fleetRoi: Number(avgRoi.toFixed(4)),
      fleetFuelEfficiency: Number(fleetFuelEfficiency.toFixed(2))
    },
    vehicles: vehicleMetrics
  };
};

export const buildAnalyticsCsv = async () => {
  const analytics = await getAnalyticsData();
  const header = [
    'Vehicle',
    'License Plate',
    'Revenue',
    'Fuel Cost',
    'Maintenance Cost',
    'Total Operational Cost',
    'Fuel Efficiency',
    'ROI'
  ];
  const rows = analytics.vehicles.map((row) => [
    row.vehicleName,
    row.licensePlate,
    row.revenue.toFixed(2),
    row.fuelCost.toFixed(2),
    row.maintenanceCost.toFixed(2),
    row.totalOperationalCost.toFixed(2),
    row.fuelEfficiency.toFixed(2),
    row.roi.toFixed(4)
  ]);

  return [header, ...rows].map((row) => row.join(',')).join('\n');
};

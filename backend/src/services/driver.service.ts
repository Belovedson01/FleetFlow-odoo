import { DriverStatus, TripStatus } from '@prisma/client';
import { prisma } from '../prisma/client';
import { ApiError } from '../utils/http';
import { emitRealtime } from '../utils/socket';

type DriverInput = {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: Date;
  status?: DriverStatus;
  safetyScore?: number;
};

export const listDrivers = async (filters: { status?: DriverStatus; search?: string }) => {
  return prisma.driver.findMany({
    where: {
      status: filters.status,
      OR: filters.search
        ? [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { licenseNumber: { contains: filters.search, mode: 'insensitive' } }
          ]
        : undefined
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getDispatchableDrivers = async () => {
  return prisma.driver.findMany({
    where: {
      status: DriverStatus.ON_DUTY,
      licenseExpiry: { gte: new Date() }
    },
    orderBy: { name: 'asc' }
  });
};

export const getDriverById = async (id: number) => {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: { trips: true }
  });
  if (!driver) {
    throw new ApiError(404, 'Driver not found.');
  }
  return driver;
};

export const createDriver = async (input: DriverInput) => {
  const driver = await prisma.driver.create({ data: input });
  emitRealtime('driver:updated', { type: 'created', driverId: driver.id });
  return driver;
};

export const updateDriver = async (id: number, input: Partial<DriverInput>) => {
  await getDriverById(id);
  const driver = await prisma.driver.update({ where: { id }, data: input });
  emitRealtime('driver:updated', { type: 'updated', driverId: driver.id });
  return driver;
};

export const updateDriverCompliance = async (
  id: number,
  input: Partial<Pick<DriverInput, 'licenseExpiry' | 'status' | 'safetyScore'>>
) => {
  await getDriverById(id);
  const driver = await prisma.driver.update({ where: { id }, data: input });
  emitRealtime('driver:updated', { type: 'compliance', driverId: driver.id });
  return driver;
};

export const deleteDriver = async (id: number) => {
  await getDriverById(id);
  const activeTrips = await prisma.trip.count({
    where: { driverId: id, status: { in: [TripStatus.DRAFT, TripStatus.DISPATCHED] } }
  });
  if (activeTrips > 0) {
    throw new ApiError(400, 'Driver has active trips and cannot be deleted.');
  }
  await prisma.driver.delete({ where: { id } });
  emitRealtime('driver:updated', { type: 'deleted', driverId: id });
};

export const recalculateDriverSafetyScore = async (driverId: number) => {
  const [completed, cancelled] = await Promise.all([
    prisma.trip.count({ where: { driverId, status: TripStatus.COMPLETED } }),
    prisma.trip.count({ where: { driverId, status: TripStatus.CANCELLED } })
  ]);

  const computed = Math.max(0, Math.min(100, 85 + completed * 1.2 - cancelled * 7));
  const updated = await prisma.driver.update({
    where: { id: driverId },
    data: { safetyScore: Number(computed.toFixed(2)) }
  });

  emitRealtime('driver:updated', { type: 'safety-score', driverId: updated.id });
  return updated;
};

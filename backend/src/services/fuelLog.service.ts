import { prisma } from '../prisma/client';
import { ApiError } from '../utils/http';
import { emitRealtime } from '../utils/socket';

type FuelLogInput = {
  vehicleId: number;
  liters: number;
  cost: number;
  odometer: number;
  date: Date;
};

export const listFuelLogs = async (vehicleId?: number) => {
  return prisma.fuelLog.findMany({
    where: { vehicleId },
    include: { vehicle: true },
    orderBy: { date: 'desc' }
  });
};

export const createFuelLog = async (input: FuelLogInput) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found.');
  }

  const fuelLog = await prisma.$transaction(async (tx) => {
    const created = await tx.fuelLog.create({
      data: input,
      include: { vehicle: true }
    });
    if (input.odometer > vehicle.odometer) {
      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: { odometer: input.odometer }
      });
    }
    return created;
  });

  emitRealtime('fuel-log:updated', { type: 'created', logId: fuelLog.id });
  emitRealtime('dashboard:refresh', { source: 'fuel-log.create' });
  return fuelLog;
};

export const updateFuelLog = async (id: number, input: Partial<FuelLogInput>) => {
  const existing = await prisma.fuelLog.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Fuel log not found.');
  }

  const fuelLog = await prisma.fuelLog.update({
    where: { id },
    data: input,
    include: { vehicle: true }
  });
  emitRealtime('fuel-log:updated', { type: 'updated', logId: id });
  emitRealtime('dashboard:refresh', { source: 'fuel-log.update' });
  return fuelLog;
};

export const deleteFuelLog = async (id: number) => {
  const existing = await prisma.fuelLog.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Fuel log not found.');
  }
  await prisma.fuelLog.delete({ where: { id } });
  emitRealtime('fuel-log:updated', { type: 'deleted', logId: id });
  emitRealtime('dashboard:refresh', { source: 'fuel-log.delete' });
};

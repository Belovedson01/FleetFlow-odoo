import { VehicleStatus } from '@prisma/client';
import { prisma } from '../prisma/client';
import { ApiError } from '../utils/http';
import { emitRealtime } from '../utils/socket';

type ServiceLogInput = {
  vehicleId: number;
  description: string;
  cost: number;
  date: Date;
};

export const listServiceLogs = async (vehicleId?: number) => {
  return prisma.serviceLog.findMany({
    where: { vehicleId },
    include: { vehicle: true },
    orderBy: { date: 'desc' }
  });
};

export const createServiceLog = async (input: ServiceLogInput) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found.');
  }

  const log = await prisma.$transaction(async (tx) => {
    const created = await tx.serviceLog.create({
      data: input,
      include: { vehicle: true }
    });
    await tx.vehicle.update({
      where: { id: input.vehicleId },
      data: { status: VehicleStatus.IN_SHOP }
    });
    return created;
  });

  emitRealtime('service-log:updated', { type: 'created', logId: log.id });
  emitRealtime('vehicle:updated', { type: 'in-shop', vehicleId: input.vehicleId });
  emitRealtime('dashboard:refresh', { source: 'service-log.create' });
  return log;
};

export const updateServiceLog = async (id: number, input: Partial<ServiceLogInput>) => {
  const existing = await prisma.serviceLog.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Service log not found.');
  }

  const log = await prisma.serviceLog.update({
    where: { id },
    data: input,
    include: { vehicle: true }
  });
  emitRealtime('service-log:updated', { type: 'updated', logId: id });
  emitRealtime('dashboard:refresh', { source: 'service-log.update' });
  return log;
};

export const deleteServiceLog = async (id: number) => {
  const existing = await prisma.serviceLog.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Service log not found.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceLog.delete({ where: { id } });
    const remainingLogs = await tx.serviceLog.count({ where: { vehicleId: existing.vehicleId } });
    if (remainingLogs === 0) {
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: VehicleStatus.AVAILABLE }
      });
    }
  });

  emitRealtime('service-log:updated', { type: 'deleted', logId: id });
  emitRealtime('vehicle:updated', { type: 'maintenance-cleared', vehicleId: existing.vehicleId });
  emitRealtime('dashboard:refresh', { source: 'service-log.delete' });
};

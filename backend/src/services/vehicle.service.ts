import { TripStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../prisma/client';
import { ApiError } from '../utils/http';
import { emitRealtime } from '../utils/socket';

type VehicleInput = {
  name: string;
  model: string;
  licensePlate: string;
  maxCapacityKg: number;
  odometer: number;
  acquisitionCost: number;
  status?: VehicleStatus;
};

export const listVehicles = async (filters: { status?: VehicleStatus; search?: string }) => {
  return prisma.vehicle.findMany({
    where: {
      status: filters.status,
      OR: filters.search
        ? [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { model: { contains: filters.search, mode: 'insensitive' } },
            { licensePlate: { contains: filters.search, mode: 'insensitive' } }
          ]
        : undefined
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const listAvailableVehicles = async () => {
  return prisma.vehicle.findMany({
    where: { status: VehicleStatus.AVAILABLE },
    orderBy: { name: 'asc' }
  });
};

export const getVehicleById = async (id: number) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: true,
      serviceLogs: true,
      fuelLogs: true
    }
  });
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found.');
  }
  return vehicle;
};

export const createVehicle = async (input: VehicleInput) => {
  const vehicle = await prisma.vehicle.create({ data: input });
  emitRealtime('vehicle:updated', { type: 'created', vehicleId: vehicle.id });
  return vehicle;
};

export const updateVehicle = async (id: number, input: Partial<VehicleInput>) => {
  await getVehicleById(id);
  const vehicle = await prisma.vehicle.update({ where: { id }, data: input });
  emitRealtime('vehicle:updated', { type: 'updated', vehicleId: vehicle.id });
  return vehicle;
};

export const retireVehicle = async (id: number) => {
  await getVehicleById(id);
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { status: VehicleStatus.RETIRED }
  });
  emitRealtime('vehicle:updated', { type: 'retired', vehicleId: vehicle.id });
  return vehicle;
};

export const deleteVehicle = async (id: number) => {
  await getVehicleById(id);
  const activeTrips = await prisma.trip.count({
    where: { vehicleId: id, status: { in: [TripStatus.DISPATCHED, TripStatus.DRAFT] } }
  });
  if (activeTrips > 0) {
    throw new ApiError(400, 'Vehicle has active trips and cannot be deleted.');
  }
  await prisma.vehicle.delete({ where: { id } });
  emitRealtime('vehicle:updated', { type: 'deleted', vehicleId: id });
};

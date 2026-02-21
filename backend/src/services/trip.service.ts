import { DriverStatus, TripStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../prisma/client';
import { ApiError } from '../utils/http';
import { emitRealtime } from '../utils/socket';
import { recalculateDriverSafetyScore } from './driver.service';

type TripInput = {
  vehicleId: number;
  driverId: number;
  cargoWeight: number;
  origin: string;
  destination: string;
  revenue: number;
  status?: TripStatus;
  startOdometer?: number;
  endOdometer?: number;
};

type TripStatusInput = {
  status: TripStatus;
  startOdometer?: number;
  endOdometer?: number;
};

const ensureTripCreationRules = async (input: TripInput) => {
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: input.vehicleId } }),
    prisma.driver.findUnique({ where: { id: input.driverId } })
  ]);

  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found.');
  }
  if (!driver) {
    throw new ApiError(404, 'Driver not found.');
  }
  if (driver.status !== DriverStatus.ON_DUTY) {
    throw new ApiError(400, 'Driver must be ON_DUTY to create trip.');
  }
  if (driver.licenseExpiry < new Date()) {
    throw new ApiError(400, 'Driver license is expired.');
  }
  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new ApiError(400, 'Vehicle must be AVAILABLE to create trip.');
  }
  if (input.cargoWeight > vehicle.maxCapacityKg) {
    throw new ApiError(400, 'Cargo weight exceeds vehicle max capacity.');
  }

  return { vehicle, driver };
};

export const listTrips = async () => {
  return prisma.trip.findMany({
    include: {
      vehicle: true,
      driver: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createTrip = async (input: TripInput) => {
  const status = input.status ?? TripStatus.DRAFT;
  const { vehicle, driver } = await ensureTripCreationRules(input);

  const trip = await prisma.$transaction(async (tx) => {
    const startOdometer = input.startOdometer ?? vehicle.odometer;

    if (status === TripStatus.COMPLETED) {
      if (!input.endOdometer || input.endOdometer < startOdometer) {
        throw new ApiError(400, 'Completed trip requires valid endOdometer.');
      }
    }

    const created = await tx.trip.create({
      data: {
        ...input,
        status,
        startOdometer,
        endOdometer: input.endOdometer
      },
      include: { vehicle: true, driver: true }
    });

    if (status === TripStatus.DISPATCHED) {
      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: { status: VehicleStatus.ON_TRIP }
      });
      await tx.driver.update({
        where: { id: input.driverId },
        data: { status: DriverStatus.ON_TRIP }
      });
    }

    if (status === TripStatus.COMPLETED) {
      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: { status: VehicleStatus.AVAILABLE, odometer: input.endOdometer! }
      });
      await tx.driver.update({
        where: { id: input.driverId },
        data: { status: DriverStatus.ON_DUTY }
      });
    }

    return created;
  });

  if (status === TripStatus.COMPLETED || status === TripStatus.CANCELLED) {
    await recalculateDriverSafetyScore(driver.id);
  }

  emitRealtime('trip:updated', { type: 'created', tripId: trip.id });
  emitRealtime('dashboard:refresh', { source: 'trip.create' });
  return trip;
};

export const updateTrip = async (id: number, input: Partial<TripInput>) => {
  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Trip not found.');
  }
  if (existing.status === TripStatus.COMPLETED) {
    throw new ApiError(400, 'Completed trips cannot be edited.');
  }

  const trip = await prisma.trip.update({
    where: { id },
    data: input,
    include: { vehicle: true, driver: true }
  });
  emitRealtime('trip:updated', { type: 'updated', tripId: id });
  return trip;
};

export const updateTripStatus = async (id: number, input: TripStatusInput) => {
  const existing = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true }
  });

  if (!existing) {
    throw new ApiError(404, 'Trip not found.');
  }

  const trip = await prisma.$transaction(async (tx) => {
    if (input.status === TripStatus.DISPATCHED) {
      if (existing.vehicle.status !== VehicleStatus.AVAILABLE && existing.status !== TripStatus.DISPATCHED) {
        throw new ApiError(400, 'Vehicle must be AVAILABLE before dispatch.');
      }
      if (existing.driver.status !== DriverStatus.ON_DUTY && existing.status !== TripStatus.DISPATCHED) {
        throw new ApiError(400, 'Driver must be ON_DUTY before dispatch.');
      }

      const startOdometer = input.startOdometer ?? existing.startOdometer ?? existing.vehicle.odometer;
      const dispatched = await tx.trip.update({
        where: { id },
        data: { status: TripStatus.DISPATCHED, startOdometer },
        include: { vehicle: true, driver: true }
      });
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: VehicleStatus.ON_TRIP }
      });
      await tx.driver.update({
        where: { id: existing.driverId },
        data: { status: DriverStatus.ON_TRIP }
      });
      return dispatched;
    }

    if (input.status === TripStatus.COMPLETED) {
      const startOdometer = existing.startOdometer ?? existing.vehicle.odometer;
      if (!input.endOdometer || input.endOdometer < startOdometer) {
        throw new ApiError(400, 'Completion requires endOdometer >= startOdometer.');
      }
      const completed = await tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.COMPLETED,
          startOdometer,
          endOdometer: input.endOdometer
        },
        include: { vehicle: true, driver: true }
      });
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: VehicleStatus.AVAILABLE, odometer: input.endOdometer }
      });
      await tx.driver.update({
        where: { id: existing.driverId },
        data: { status: DriverStatus.ON_DUTY }
      });
      return completed;
    }

    if (input.status === TripStatus.CANCELLED) {
      const cancelled = await tx.trip.update({
        where: { id },
        data: { status: TripStatus.CANCELLED },
        include: { vehicle: true, driver: true }
      });
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: VehicleStatus.AVAILABLE }
      });
      await tx.driver.update({
        where: { id: existing.driverId },
        data: { status: DriverStatus.ON_DUTY }
      });
      return cancelled;
    }

    if (input.status === TripStatus.DRAFT) {
      const draft = await tx.trip.update({
        where: { id },
        data: { status: TripStatus.DRAFT },
        include: { vehicle: true, driver: true }
      });
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: VehicleStatus.AVAILABLE }
      });
      await tx.driver.update({
        where: { id: existing.driverId },
        data: { status: DriverStatus.ON_DUTY }
      });
      return draft;
    }

    return existing;
  });

  if (input.status === TripStatus.COMPLETED || input.status === TripStatus.CANCELLED) {
    await recalculateDriverSafetyScore(existing.driverId);
  }

  emitRealtime('trip:updated', { type: 'status', tripId: id, status: input.status });
  emitRealtime('vehicle:updated', { type: 'trip-status', vehicleId: existing.vehicleId });
  emitRealtime('dashboard:refresh', { source: 'trip.status' });
  return trip;
};

export const deleteTrip = async (id: number) => {
  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Trip not found.');
  }

  await prisma.$transaction(async (tx) => {
    if (existing.status === TripStatus.DISPATCHED) {
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: VehicleStatus.AVAILABLE }
      });
      await tx.driver.update({
        where: { id: existing.driverId },
        data: { status: DriverStatus.ON_DUTY }
      });
    }
    await tx.trip.delete({ where: { id } });
  });

  emitRealtime('trip:updated', { type: 'deleted', tripId: id });
  emitRealtime('dashboard:refresh', { source: 'trip.delete' });
};

import { TripStatus } from '@prisma/client';
import { z } from 'zod';

export const createTripSchema = z.object({
  vehicleId: z.number().int().positive(),
  driverId: z.number().int().positive(),
  cargoWeight: z.number().positive(),
  origin: z.string().min(2),
  destination: z.string().min(2),
  revenue: z.number().min(0),
  status: z.nativeEnum(TripStatus).optional(),
  startOdometer: z.number().min(0).optional(),
  endOdometer: z.number().min(0).optional()
});

export const updateTripSchema = createTripSchema.partial();

export const updateTripStatusSchema = z.object({
  status: z.nativeEnum(TripStatus),
  endOdometer: z.number().min(0).optional(),
  startOdometer: z.number().min(0).optional()
});

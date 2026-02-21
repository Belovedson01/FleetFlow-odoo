import { VehicleStatus } from '@prisma/client';
import { z } from 'zod';

export const createVehicleSchema = z.object({
  name: z.string().min(2),
  model: z.string().min(2),
  licensePlate: z.string().min(4),
  maxCapacityKg: z.number().positive(),
  odometer: z.number().min(0),
  acquisitionCost: z.number().positive(),
  status: z.nativeEnum(VehicleStatus).optional()
});

export const updateVehicleSchema = createVehicleSchema.partial();

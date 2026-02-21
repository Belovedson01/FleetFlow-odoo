import { z } from 'zod';

export const createFuelLogSchema = z.object({
  vehicleId: z.number().int().positive(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  odometer: z.number().min(0),
  date: z.coerce.date()
});

export const updateFuelLogSchema = createFuelLogSchema.partial();

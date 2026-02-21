import { z } from 'zod';

export const createServiceLogSchema = z.object({
  vehicleId: z.number().int().positive(),
  description: z.string().min(3),
  cost: z.number().positive(),
  date: z.coerce.date()
});

export const updateServiceLogSchema = createServiceLogSchema.partial();

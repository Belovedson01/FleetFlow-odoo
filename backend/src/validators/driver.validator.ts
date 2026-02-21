import { DriverStatus } from '@prisma/client';
import { z } from 'zod';

export const createDriverSchema = z.object({
  name: z.string().min(2),
  licenseNumber: z.string().min(3),
  licenseCategory: z.string().min(1),
  licenseExpiry: z.coerce.date(),
  status: z.nativeEnum(DriverStatus).optional(),
  safetyScore: z.number().min(0).max(100).optional()
});

export const updateDriverSchema = createDriverSchema.partial();

export const updateDriverComplianceSchema = z.object({
  licenseExpiry: z.coerce.date().optional(),
  status: z.nativeEnum(DriverStatus).optional(),
  safetyScore: z.number().min(0).max(100).optional()
});

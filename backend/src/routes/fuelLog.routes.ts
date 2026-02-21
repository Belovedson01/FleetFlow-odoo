import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createFuelLogController,
  deleteFuelLogController,
  getFuelLogs,
  updateFuelLogController
} from '../controllers/fuelLog.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createFuelLogSchema, updateFuelLogSchema } from '../validators/fuelLog.validator';

const router = Router();
router.use(authenticate);

router.get('/', authorize(Role.MANAGER, Role.DISPATCHER, Role.SAFETY), getFuelLogs);
router.post(
  '/',
  authorize(Role.MANAGER, Role.DISPATCHER),
  validateBody(createFuelLogSchema),
  createFuelLogController
);
router.put(
  '/:id',
  authorize(Role.MANAGER, Role.DISPATCHER),
  validateBody(updateFuelLogSchema),
  updateFuelLogController
);
router.delete('/:id', authorize(Role.MANAGER, Role.DISPATCHER), deleteFuelLogController);

export default router;

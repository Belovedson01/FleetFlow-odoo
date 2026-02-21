import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createServiceLogController,
  deleteServiceLogController,
  getServiceLogs,
  updateServiceLogController
} from '../controllers/serviceLog.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createServiceLogSchema, updateServiceLogSchema } from '../validators/serviceLog.validator';

const router = Router();
router.use(authenticate);

router.get('/', authorize(Role.MANAGER, Role.DISPATCHER, Role.SAFETY), getServiceLogs);
router.post(
  '/',
  authorize(Role.MANAGER, Role.SAFETY),
  validateBody(createServiceLogSchema),
  createServiceLogController
);
router.put(
  '/:id',
  authorize(Role.MANAGER, Role.SAFETY),
  validateBody(updateServiceLogSchema),
  updateServiceLogController
);
router.delete('/:id', authorize(Role.MANAGER, Role.SAFETY), deleteServiceLogController);

export default router;

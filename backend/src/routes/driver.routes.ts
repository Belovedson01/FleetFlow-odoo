import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createDriverController,
  deleteDriverController,
  getAvailableDrivers,
  getDriver,
  getDrivers,
  updateDriverComplianceController,
  updateDriverController
} from '../controllers/driver.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  createDriverSchema,
  updateDriverComplianceSchema,
  updateDriverSchema
} from '../validators/driver.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.MANAGER, Role.DISPATCHER, Role.SAFETY), getDrivers);
router.get('/available', authorize(Role.MANAGER, Role.DISPATCHER), getAvailableDrivers);
router.get('/:id', authorize(Role.MANAGER, Role.DISPATCHER, Role.SAFETY), getDriver);
router.post('/', authorize(Role.MANAGER, Role.SAFETY), validateBody(createDriverSchema), createDriverController);
router.put('/:id', authorize(Role.MANAGER), validateBody(updateDriverSchema), updateDriverController);
router.patch(
  '/:id/compliance',
  authorize(Role.SAFETY),
  validateBody(updateDriverComplianceSchema),
  updateDriverComplianceController
);
router.delete('/:id', authorize(Role.MANAGER), deleteDriverController);

export default router;

import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createVehicleController,
  deleteVehicleController,
  getDispatchVehicles,
  getVehicle,
  getVehicles,
  retireVehicleController,
  updateVehicleController
} from '../controllers/vehicle.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createVehicleSchema, updateVehicleSchema } from '../validators/vehicle.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.MANAGER, Role.DISPATCHER, Role.SAFETY), getVehicles);
router.get('/available', authorize(Role.MANAGER, Role.DISPATCHER), getDispatchVehicles);
router.get('/:id', authorize(Role.MANAGER, Role.DISPATCHER, Role.SAFETY), getVehicle);
router.post('/', authorize(Role.MANAGER), validateBody(createVehicleSchema), createVehicleController);
router.put('/:id', authorize(Role.MANAGER), validateBody(updateVehicleSchema), updateVehicleController);
router.patch('/:id/retire', authorize(Role.MANAGER), retireVehicleController);
router.delete('/:id', authorize(Role.MANAGER), deleteVehicleController);

export default router;

import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createTripController,
  deleteTripController,
  getTrips,
  updateTripController,
  updateTripStatusController
} from '../controllers/trip.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createTripSchema, updateTripSchema, updateTripStatusSchema } from '../validators/trip.validator';

const router = Router();
router.use(authenticate);

router.get('/', authorize(Role.MANAGER, Role.DISPATCHER, Role.SAFETY), getTrips);
router.post('/', authorize(Role.DISPATCHER), validateBody(createTripSchema), createTripController);
router.put('/:id', authorize(Role.DISPATCHER), validateBody(updateTripSchema), updateTripController);
router.patch(
  '/:id/status',
  authorize(Role.DISPATCHER),
  validateBody(updateTripStatusSchema),
  updateTripStatusController
);
router.delete('/:id', authorize(Role.DISPATCHER, Role.MANAGER), deleteTripController);

export default router;

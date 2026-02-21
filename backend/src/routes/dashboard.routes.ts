import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  getDispatcherDashboardController,
  getFinanceDashboardController,
  getManagerDashboardController,
  getSafetyDashboardController
} from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/manager', requireRole([Role.MANAGER]), getManagerDashboardController);
router.get('/dispatcher', requireRole([Role.DISPATCHER]), getDispatcherDashboardController);
router.get('/safety', requireRole([Role.SAFETY]), getSafetyDashboardController);
router.get('/finance', requireRole([Role.ANALYST]), getFinanceDashboardController);

export default router;

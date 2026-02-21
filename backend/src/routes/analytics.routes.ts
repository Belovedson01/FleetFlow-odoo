import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  exportAnalyticsCsvController,
  exportAnalyticsPdfController,
  getAnalyticsController,
  getDashboardController
} from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/dashboard', authorize(Role.MANAGER, Role.DISPATCHER, Role.SAFETY), getDashboardController);
router.get('/reports', authorize(Role.MANAGER, Role.ANALYST), getAnalyticsController);
router.get('/reports/export/csv', authorize(Role.MANAGER, Role.ANALYST), exportAnalyticsCsvController);
router.get('/reports/export/pdf', authorize(Role.MANAGER, Role.ANALYST), exportAnalyticsPdfController);

export default router;

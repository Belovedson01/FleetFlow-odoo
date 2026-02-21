import { Router } from 'express';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import driverRoutes from './driver.routes';
import fuelLogRoutes from './fuelLog.routes';
import serviceLogRoutes from './serviceLog.routes';
import tripRoutes from './trip.routes';
import vehicleRoutes from './vehicle.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/trips', tripRoutes);
router.use('/service-logs', serviceLogRoutes);
router.use('/fuel-logs', fuelLogRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

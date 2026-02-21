import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/http';
import {
  getDispatcherDashboardData,
  getFinanceDashboardData,
  getManagerDashboardData,
  getSafetyDashboardData
} from '../services/dashboard.service';

export const getManagerDashboardController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getManagerDashboardData();
  res.json(data);
});

export const getDispatcherDashboardController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getDispatcherDashboardData();
  res.json(data);
});

export const getSafetyDashboardController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getSafetyDashboardData();
  res.json(data);
});

export const getFinanceDashboardController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getFinanceDashboardData();
  res.json(data);
});

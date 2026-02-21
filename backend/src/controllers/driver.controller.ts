import { DriverStatus } from '@prisma/client';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/http';
import {
  createDriver,
  deleteDriver,
  getDispatchableDrivers,
  getDriverById,
  listDrivers,
  updateDriver,
  updateDriverCompliance
} from '../services/driver.service';

export const getDrivers = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as DriverStatus | undefined;
  const search = (req.query.search as string | undefined)?.trim();
  const drivers = await listDrivers({ status, search });
  res.json(drivers);
});

export const getAvailableDrivers = asyncHandler(async (_req: Request, res: Response) => {
  const drivers = await getDispatchableDrivers();
  res.json(drivers);
});

export const getDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await getDriverById(Number(req.params.id));
  res.json(driver);
});

export const createDriverController = asyncHandler(async (req: Request, res: Response) => {
  const driver = await createDriver(req.body);
  res.status(201).json(driver);
});

export const updateDriverController = asyncHandler(async (req: Request, res: Response) => {
  const driver = await updateDriver(Number(req.params.id), req.body);
  res.json(driver);
});

export const updateDriverComplianceController = asyncHandler(async (req: Request, res: Response) => {
  const driver = await updateDriverCompliance(Number(req.params.id), req.body);
  res.json(driver);
});

export const deleteDriverController = asyncHandler(async (req: Request, res: Response) => {
  await deleteDriver(Number(req.params.id));
  res.status(204).send();
});

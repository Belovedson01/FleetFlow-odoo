import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/http';
import { createFuelLog, deleteFuelLog, listFuelLogs, updateFuelLog } from '../services/fuelLog.service';

export const getFuelLogs = asyncHandler(async (req: Request, res: Response) => {
  const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
  const logs = await listFuelLogs(vehicleId);
  res.json(logs);
});

export const createFuelLogController = asyncHandler(async (req: Request, res: Response) => {
  const log = await createFuelLog(req.body);
  res.status(201).json(log);
});

export const updateFuelLogController = asyncHandler(async (req: Request, res: Response) => {
  const log = await updateFuelLog(Number(req.params.id), req.body);
  res.json(log);
});

export const deleteFuelLogController = asyncHandler(async (req: Request, res: Response) => {
  await deleteFuelLog(Number(req.params.id));
  res.status(204).send();
});

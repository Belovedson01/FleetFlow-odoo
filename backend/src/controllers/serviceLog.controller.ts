import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/http';
import {
  createServiceLog,
  deleteServiceLog,
  listServiceLogs,
  updateServiceLog
} from '../services/serviceLog.service';

export const getServiceLogs = asyncHandler(async (req: Request, res: Response) => {
  const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
  const logs = await listServiceLogs(vehicleId);
  res.json(logs);
});

export const createServiceLogController = asyncHandler(async (req: Request, res: Response) => {
  const log = await createServiceLog(req.body);
  res.status(201).json(log);
});

export const updateServiceLogController = asyncHandler(async (req: Request, res: Response) => {
  const log = await updateServiceLog(Number(req.params.id), req.body);
  res.json(log);
});

export const deleteServiceLogController = asyncHandler(async (req: Request, res: Response) => {
  await deleteServiceLog(Number(req.params.id));
  res.status(204).send();
});

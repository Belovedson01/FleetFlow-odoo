import { VehicleStatus } from '@prisma/client';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/http';
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  listAvailableVehicles,
  listVehicles,
  retireVehicle,
  updateVehicle
} from '../services/vehicle.service';

export const getVehicles = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as VehicleStatus | undefined;
  const search = (req.query.search as string | undefined)?.trim();
  const vehicles = await listVehicles({ status, search });
  res.json(vehicles);
});

export const getDispatchVehicles = asyncHandler(async (_req: Request, res: Response) => {
  const vehicles = await listAvailableVehicles();
  res.json(vehicles);
});

export const getVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await getVehicleById(Number(req.params.id));
  res.json(vehicle);
});

export const createVehicleController = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await createVehicle(req.body);
  res.status(201).json(vehicle);
});

export const updateVehicleController = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await updateVehicle(Number(req.params.id), req.body);
  res.json(vehicle);
});

export const retireVehicleController = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await retireVehicle(Number(req.params.id));
  res.json(vehicle);
});

export const deleteVehicleController = asyncHandler(async (req: Request, res: Response) => {
  await deleteVehicle(Number(req.params.id));
  res.status(204).send();
});

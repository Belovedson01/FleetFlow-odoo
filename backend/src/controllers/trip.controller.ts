import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/http';
import {
  createTrip,
  deleteTrip,
  listTrips,
  updateTrip,
  updateTripStatus
} from '../services/trip.service';

export const getTrips = asyncHandler(async (_req: Request, res: Response) => {
  const trips = await listTrips();
  res.json(trips);
});

export const createTripController = asyncHandler(async (req: Request, res: Response) => {
  const trip = await createTrip(req.body);
  res.status(201).json(trip);
});

export const updateTripController = asyncHandler(async (req: Request, res: Response) => {
  const trip = await updateTrip(Number(req.params.id), req.body);
  res.json(trip);
});

export const updateTripStatusController = asyncHandler(async (req: Request, res: Response) => {
  const trip = await updateTripStatus(Number(req.params.id), req.body);
  res.json(trip);
});

export const deleteTripController = asyncHandler(async (req: Request, res: Response) => {
  await deleteTrip(Number(req.params.id));
  res.status(204).send();
});

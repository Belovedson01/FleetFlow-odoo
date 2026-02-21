import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/http';
import { getUserProfile, loginUser, registerUser } from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json(user);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = await loginUser(req.body.email, req.body.password);
  res.json(data);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserProfile(req.user!.id);
  res.json(user);
});

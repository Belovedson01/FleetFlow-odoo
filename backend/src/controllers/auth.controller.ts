import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/http';
import {
  clearRefreshToken,
  createPrivilegedUser,
  forgotPassword,
  getUserProfile,
  loginUser,
  refreshAccessToken,
  registerUser,
  resetPassword
} from '../services/auth.service';
import { ApiError } from '../utils/http';

const refreshCookieName = process.env.REFRESH_COOKIE_NAME || 'fleetflow_refresh_token';
const refreshCookieMaxAge = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7) * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: refreshCookieMaxAge
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json(user);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = await loginUser(req.body.email, req.body.password);
  res.cookie(refreshCookieName, data.refreshToken, refreshCookieOptions);
  res.json({
    token: data.token,
    user: data.user
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserProfile(req.user!.id);
  res.json(user);
});

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const response = await forgotPassword(req.body.email);
  res.json(response);
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const response = await resetPassword(req.body.token, req.body.password);
  res.json(response);
});

export const refreshTokenController = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[refreshCookieName];
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token missing.');
  }

  const response = await refreshAccessToken(refreshToken);
  res.cookie(refreshCookieName, response.refreshToken, refreshCookieOptions);
  res.json({
    token: response.token,
    user: response.user
  });
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  await clearRefreshToken(req.user!.id);
  res.clearCookie(refreshCookieName, { path: '/api/auth' });
  res.json({ message: 'Logged out.' });
});

export const createPrivilegedUserController = asyncHandler(async (req: Request, res: Response) => {
  const user = await createPrivilegedUser(req.body);
  res.status(201).json(user);
});

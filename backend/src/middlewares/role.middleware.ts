import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/http';

export const requireRole =
  (roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions.'));
    }
    next();
  };

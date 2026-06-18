import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../exceptions/api-error.js';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // We assume requireAuth has already run and attached res.locals.user
  const user = res.locals.user;

  if (!user || user.role !== 'ADMIN') {
    return next(new ApiError(403, 'Access denied. Admin privileges required.'));
  }

  next();
};

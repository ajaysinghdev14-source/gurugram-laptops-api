import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../common/config/env.js';
import { ApiError } from '../../../common/exceptions/api-error.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get the token from cookies (or fallback to header for Postman testing)
    const token = 
      req.cookies.accessToken || 
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : undefined);

    if (!token) {
      throw ApiError.unauthorized('Access denied. No token provided');
    }

    // 4. Verify the token signature and expiration
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as { userId: string; role: string };

    // 5. Attach the payload to `res.locals` so the Controller can read it!
    res.locals.user = { id: decoded.userId, role: decoded.role };

    // 6. Move to the next middleware or controller
    next();
  } catch (error) {
    // If jwt.verify fails (e.g., token is expired or fake), it throws an error.
    next(ApiError.unauthorized('Invalid or expired token.'));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = res.locals.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return next(ApiError.forbidden('Access denied. Insufficient permissions.'));
    }
    next();
  };
};

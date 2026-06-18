import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../exceptions/api-error.js';
import { env } from '../config/env.js';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction, // Express REQUIRES 4 parameters for error handlers!
) => {
  let error = err;

  // 1. If the error isn't our custom ApiError, it's an unexpected bug.
  // We wrap it in our ApiError so it's formatted correctly.
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, false);
  }

  // 2. Log severe, unexpected bugs to the console so we can debug them.
  if (!error.isOperational) {
    console.error('🔥 UNEXPECTED BUG:', err);
  }

  // 3. Send the clean JSON response to the frontend
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    // Only leak the stack trace to the frontend if we are in development mode!
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

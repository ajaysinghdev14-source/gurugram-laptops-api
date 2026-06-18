import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/apiError.js";
import { env } from "../config/env.js";

/**
 * Global error handler middleware. Must be registered last (after all routes).
 * Catches any error passed to next(err) and sends a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: string[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
  } else if ((err as { code?: string }).code === "23505") {
    statusCode = 409;
    message = "Resource already exists";
  } else {
    message = err.message || "Internal Server Error";
  }

  if (env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

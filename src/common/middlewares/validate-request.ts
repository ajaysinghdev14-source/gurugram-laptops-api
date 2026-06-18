import type { Request, Response, NextFunction } from 'express';
// 1. Changed AnyZodObject to ZodSchema (which covers any Zod validation)
import { type ZodSchema, ZodError } from 'zod';
import { ApiError } from '../exceptions/api-error.js';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // 2. Changed error.errors to error.issues (this is the standard Zod property)
        const errorMessages = error.issues
          .map((issue) => `${issue.path.join('.')} is ${issue.message}`)
          .join(', ');

        return next(ApiError.badRequest(errorMessages));
      }

      return next(ApiError.internal('Unexpected validation error'));
    }
  };
};

import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";
import { verifyAccessToken } from "../modules/user-management/token.service.js";

export type AuthUser = { userId: string; identifier: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (req.headers.authorization as string | undefined) || req.cookies?.accessToken;

  if (!token) {
    next(new ApiError(401, "Unauthorized", ["Missing or invalid token"]));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, identifier: payload.identifier };
    next();
  } catch {
    next(new ApiError(401, "Unauthorized", ["Invalid or expired token"]));
  }
}

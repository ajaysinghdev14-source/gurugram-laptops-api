import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { ApiError } from "../utils/apiError.js";

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next(new ApiError(401, "Unauthorized"));
    return;
  }

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, req.user.userId))
    .limit(1);

  if (!user || user.role.toLowerCase() !== "admin") {
    next(new ApiError(403, "Admin access required"));
    return;
  }

  next();
}

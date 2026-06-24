import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/admin.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as adminController from "./admin.controller.js";

export const adminRouter = Router();

// All admin routes require auth + admin role
adminRouter.use(requireAuth);
adminRouter.use(asyncHandler(requireAdmin));

adminRouter.get("/users", asyncHandler(adminController.AdminController.getAllUsers));
adminRouter.patch("/users/:id/role", asyncHandler(adminController.AdminController.updateUserRole));
adminRouter.patch("/users/:id/status", asyncHandler(adminController.AdminController.updateUserStatus));

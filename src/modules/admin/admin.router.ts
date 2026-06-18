import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/admin.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as adminController from "./admin.controller.js";

export const adminRouter = Router();

// All admin routes require auth + admin role
adminRouter.use(requireAuth);
adminRouter.use(asyncHandler(requireAdmin));

// Admin stats must be before /:jobId style routes
adminRouter.get("/jobs/stats", asyncHandler(adminController.getAdminStats));
adminRouter.get("/jobs", asyncHandler(adminController.getAdminJobs));
adminRouter.post("/jobs/:adminId", asyncHandler(adminController.createJob));
adminRouter.put("/jobs/:jobId", asyncHandler(adminController.updateJob));
adminRouter.delete("/jobs/:jobId", asyncHandler(adminController.deleteJob));
adminRouter.patch(
  "/jobs/:jobId/status",
  asyncHandler(adminController.toggleJobStatus),
);
adminRouter.patch(
  "/jobs/applications/:applicationId/status",
  asyncHandler(adminController.updateApplicationStatus),
);

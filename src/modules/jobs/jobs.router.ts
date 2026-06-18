import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as jobsController from "./jobs.controller.js";

export const jobsRouter = Router();

// Search (POST body, no path params - must be before /:jobId)
jobsRouter.post("/search", asyncHandler(jobsController.searchJobs));

// Recommended (auth required - must be before /:jobId)
jobsRouter.get(
  "/recommended/:userId",
  requireAuth,
  asyncHandler(jobsController.getRecommendedJobs),
);

// Save / Unsave lists (must be before /:jobId)
jobsRouter.get(
  "/saved/:userId",
  requireAuth,
  asyncHandler(jobsController.getSavedJobs),
);
jobsRouter.get(
  "/saved/:userId/ids",
  requireAuth,
  asyncHandler(jobsController.getSavedJobIds),
);

// Applications lists (must be before /:jobId)
jobsRouter.get(
  "/applications/:userId",
  requireAuth,
  asyncHandler(jobsController.getUserApplications),
);
jobsRouter.get(
  "/applications/:userId/:applicationId",
  requireAuth,
  asyncHandler(jobsController.getApplicationDetail),
);
jobsRouter.get(
  "/applied/:userId/ids",
  requireAuth,
  asyncHandler(jobsController.getAppliedJobIds),
);

// Dashboard stats (must be before /:jobId)
jobsRouter.get(
  "/stats/:userId",
  requireAuth,
  asyncHandler(jobsController.getDashboardStats),
);

// Public job listing
jobsRouter.get("/", asyncHandler(jobsController.getJobs));

// Job detail (must be LAST because /:jobId is a catch-all param)
jobsRouter.get("/:jobId", asyncHandler(jobsController.getJobDetail));

// Save / Unsave actions on specific job
jobsRouter.post(
  "/:jobId/save/:userId",
  requireAuth,
  asyncHandler(jobsController.saveJob),
);
jobsRouter.delete(
  "/:jobId/save/:userId",
  requireAuth,
  asyncHandler(jobsController.unsaveJob),
);

// Apply to specific job
jobsRouter.post(
  "/:jobId/apply/:userId",
  requireAuth,
  asyncHandler(jobsController.applyToJob),
);

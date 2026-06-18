import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as onboardingController from "./onboarding.controller.js";

export const onboardingRouter = Router();

onboardingRouter.get(
  "/status/:userId",
  requireAuth,
  asyncHandler(onboardingController.getStatus),
);

onboardingRouter.post(
  "/profile/:userId",
  requireAuth,
  asyncHandler(onboardingController.saveProfile),
);

onboardingRouter.post(
  "/preferences/:userId",
  requireAuth,
  asyncHandler(onboardingController.savePreferences),
);

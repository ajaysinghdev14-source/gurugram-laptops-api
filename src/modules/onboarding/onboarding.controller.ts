import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import * as onboardingService from "./onboarding.service.js";
import {
  saveProfileBodySchema,
  savePreferencesBodySchema,
} from "./onboarding.types.js";

export async function getStatus(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId;
  if (req.user!.userId !== userId) {
    throw new ApiError(403, "Forbidden");
  }
  const status = await onboardingService.getOnboardingStatus(userId);
  res.json(new ApiResponse(200, "Onboarding status", status));
}

export async function saveProfile(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId;
  if (req.user!.userId !== userId) {
    throw new ApiError(403, "Forbidden");
  }
  const body = saveProfileBodySchema.parse(req.body);
  const profile = await onboardingService.saveProfile(userId, body);
  res.status(201).json(new ApiResponse(201, "Profile saved", profile));
}

export async function savePreferences(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId;
  if (req.user!.userId !== userId) {
    throw new ApiError(403, "Forbidden");
  }
  const body = savePreferencesBodySchema.parse(req.body);
  const profile = await onboardingService.savePreferences(userId, body);
  res.status(200).json(new ApiResponse(200, "Preferences saved", profile));
}

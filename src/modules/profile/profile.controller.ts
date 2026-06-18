import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import * as profileService from "./profile.service.js";
import {
  updateBasicProfileSchema,
  personalDetailsSchema,
  headlineSchema,
  summarySchema,
  employmentSchema,
  educationSchema,
  projectSchema,
  itSkillSchema,
  initiateEmailChangeSchema,
  verifyEmailChangeSchema,
} from "./profile.types.js";

function assertOwner(req: Request): string {
  const userId = req.params.userId;
  if (req.user!.userId !== userId) {
    throw new ApiError(403, "Forbidden");
  }
  return userId;
}

// ─── Full Profile ────────────────────────────────────────────

export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = assertOwner(req);
  const data = await profileService.getFullProfile(userId);
  res.json(new ApiResponse(200, "Profile fetched", data));
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const body = updateBasicProfileSchema.parse(req.body);
  const data = await profileService.updateBasicProfile(userId, body);
  res.json(new ApiResponse(200, "Profile updated", data));
}

// ─── Headline + Summary ──────────────────────────────────────

export async function updateHeadline(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const { headline } = headlineSchema.parse(req.body);
  const data = await profileService.updateHeadline(userId, headline);
  res.json(new ApiResponse(200, "Headline updated", data));
}

export async function updateSummary(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const { summary } = summarySchema.parse(req.body);
  const data = await profileService.updateSummary(userId, summary);
  res.json(new ApiResponse(200, "Summary updated", data));
}

// ─── Personal Details ────────────────────────────────────────

export async function getPersonalDetails(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const data = await profileService.getPersonalDetails(userId);
  res.json(new ApiResponse(200, "Personal details fetched", data));
}

export async function updatePersonalDetails(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const body = personalDetailsSchema.parse(req.body);
  const data = await profileService.upsertPersonalDetails(userId, body);
  res.json(new ApiResponse(200, "Personal details updated", data));
}

// ─── Employment ──────────────────────────────────────────────

export async function getEmployments(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const data = await profileService.getEmployments(userId);
  res.json(new ApiResponse(200, "Employments fetched", data));
}

export async function createEmployment(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const body = employmentSchema.parse(req.body);
  const data = await profileService.createEmployment(userId, body);
  res.status(201).json(new ApiResponse(201, "Employment created", data));
}

export async function updateEmployment(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const employmentId = Number(req.params.employmentId);
  const body = employmentSchema.parse(req.body);
  const data = await profileService.updateEmployment(
    userId,
    employmentId,
    body,
  );
  res.json(new ApiResponse(200, "Employment updated", data));
}

export async function deleteEmployment(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const employmentId = Number(req.params.employmentId);
  await profileService.deleteEmployment(userId, employmentId);
  res.json(new ApiResponse(200, "Employment deleted", null));
}

// ─── Education ───────────────────────────────────────────────

export async function getEducations(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const data = await profileService.getEducations(userId);
  res.json(new ApiResponse(200, "Educations fetched", data));
}

export async function createEducation(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const body = educationSchema.parse(req.body);
  const data = await profileService.createEducation(userId, body);
  res.status(201).json(new ApiResponse(201, "Education created", data));
}

export async function updateEducation(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const educationId = Number(req.params.educationId);
  const body = educationSchema.parse(req.body);
  const data = await profileService.updateEducation(userId, educationId, body);
  res.json(new ApiResponse(200, "Education updated", data));
}

export async function deleteEducation(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const educationId = Number(req.params.educationId);
  await profileService.deleteEducation(userId, educationId);
  res.json(new ApiResponse(200, "Education deleted", null));
}

// ─── Projects ────────────────────────────────────────────────

export async function getProjects(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const data = await profileService.getProjects(userId);
  res.json(new ApiResponse(200, "Projects fetched", data));
}

export async function createProject(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const body = projectSchema.parse(req.body);
  const data = await profileService.createProject(userId, body);
  res.status(201).json(new ApiResponse(201, "Project created", data));
}

export async function updateProject(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const projectId = Number(req.params.projectId);
  const body = projectSchema.parse(req.body);
  const data = await profileService.updateProject(userId, projectId, body);
  res.json(new ApiResponse(200, "Project updated", data));
}

export async function deleteProject(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const projectId = Number(req.params.projectId);
  await profileService.deleteProject(userId, projectId);
  res.json(new ApiResponse(200, "Project deleted", null));
}

// ─── IT Skills ───────────────────────────────────────────────

export async function getItSkills(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const data = await profileService.getItSkills(userId);
  res.json(new ApiResponse(200, "IT skills fetched", data));
}

export async function createItSkill(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const body = itSkillSchema.parse(req.body);
  const data = await profileService.createItSkill(userId, body);
  res.status(201).json(new ApiResponse(201, "IT skill created", data));
}

export async function updateItSkill(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const skillId = Number(req.params.skillId);
  const body = itSkillSchema.parse(req.body);
  const data = await profileService.updateItSkill(userId, skillId, body);
  res.json(new ApiResponse(200, "IT skill updated", data));
}

export async function deleteItSkill(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const skillId = Number(req.params.skillId);
  await profileService.deleteItSkill(userId, skillId);
  res.json(new ApiResponse(200, "IT skill deleted", null));
}

// ─── Resume ──────────────────────────────────────────────────

export async function uploadResume(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }
  const data = await profileService.upsertResume(
    userId,
    req.file.originalname,
    req.file.path,
  );
  res.status(201).json(new ApiResponse(201, "Resume uploaded", data));
}

export async function deleteResume(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  await profileService.deleteResume(userId);
  res.json(new ApiResponse(200, "Resume deleted", null));
}

// ─── Email change (OTP) ───────────────────────────────────────

export async function initiateEmailChange(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const { newEmail } = initiateEmailChangeSchema.parse(req.body);
  const data = await profileService.initiateEmailChange(userId, newEmail);
  res.json(new ApiResponse(200, "OTP sent to your new email", data));
}

export async function verifyEmailChange(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = assertOwner(req);
  const { newEmail, otp } = verifyEmailChangeSchema.parse(req.body);
  const data = await profileService.verifyEmailChange(userId, newEmail, otp);
  res.json(new ApiResponse(200, "Email updated successfully", data));
}

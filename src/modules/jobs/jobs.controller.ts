import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as jobsService from "./jobs.service.js";
import { jobSearchSchema, applyJobSchema } from "./jobs.types.js";

// ─── Public / Authenticated Job Endpoints ────────────────────

export async function getJobs(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(50, Math.max(1, Number(req.query.size) || 10));
  const userId = (req.query.userId as string) || undefined;
  const data = await jobsService.getJobs(page, size, userId);
  res.json(new ApiResponse(200, "Jobs fetched", data));
}

export async function searchJobs(req: Request, res: Response): Promise<void> {
  const parsed = jobSearchSchema.parse(req.body);
  const { page: bodyPage, size: bodySize, userId, ...filters } = parsed;
  const page = Math.max(1, Number(req.query.page) ?? bodyPage ?? 1);
  const size = Math.min(50, Math.max(1, Number(req.query.size) ?? bodySize ?? 10));
  const data = await jobsService.searchJobs(filters, page, size, userId);
  res.json(new ApiResponse(200, "Search results", data));
}

export async function getRecommendedJobs(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(50, Math.max(1, Number(req.query.size) || 10));
  const data = await jobsService.getRecommendedJobs(userId, page, size);
  res.json(new ApiResponse(200, "Recommended jobs", data));
}

export async function getJobDetail(
  req: Request,
  res: Response,
): Promise<void> {
  const jobId = Number(req.params.jobId);
  const userId = (req.query.userId as string) || undefined;
  const data = await jobsService.getJobDetail(jobId, userId);
  res.json(new ApiResponse(200, "Job detail", data));
}

// ─── Save / Unsave ───────────────────────────────────────────

export async function saveJob(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId;
  const jobId = Number(req.params.jobId);
  const data = await jobsService.saveJob(userId, jobId);
  res.status(201).json(new ApiResponse(201, "Job saved", data));
}

export async function unsaveJob(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId;
  const jobId = Number(req.params.jobId);
  await jobsService.unsaveJob(userId, jobId);
  res.json(new ApiResponse(200, "Job unsaved", null));
}

export async function getSavedJobs(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(50, Math.max(1, Number(req.query.size) || 10));
  const data = await jobsService.getSavedJobs(userId, page, size);
  res.json(new ApiResponse(200, "Saved jobs", data));
}

export async function getSavedJobIds(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId;
  const data = await jobsService.getSavedJobIds(userId);
  res.json(new ApiResponse(200, "Saved job IDs", data));
}

// ─── Applications ────────────────────────────────────────────

export async function applyToJob(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId;
  const jobId = Number(req.params.jobId);
  const { coverLetter } = applyJobSchema.parse(req.body);
  const data = await jobsService.applyToJob(userId, jobId, coverLetter);
  res.status(201).json(new ApiResponse(201, "Application submitted", data));
}

export async function getUserApplications(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId;
  const data = await jobsService.getUserApplications(userId);
  res.json(new ApiResponse(200, "Applications fetched", data));
}

export async function getApplicationDetail(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId;
  const applicationId = Number(req.params.applicationId);
  const data = await jobsService.getApplicationDetail(userId, applicationId);
  res.json(new ApiResponse(200, "Application detail", data));
}

export async function getAppliedJobIds(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId;
  const data = await jobsService.getAppliedJobIds(userId);
  res.json(new ApiResponse(200, "Applied job IDs", data));
}

// ─── Dashboard Stats ─────────────────────────────────────────

export async function getDashboardStats(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId;
  const data = await jobsService.getDashboardStats(userId);
  res.json(new ApiResponse(200, "Dashboard stats", data));
}

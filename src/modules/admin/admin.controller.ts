import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as jobsService from "../jobs/jobs.service.js";
import {
  createJobSchema,
  updateApplicationStatusSchema,
} from "../jobs/jobs.types.js";

export async function getAdminStats(
  _req: Request,
  res: Response,
): Promise<void> {
  const data = await jobsService.getAdminStats();
  res.json(new ApiResponse(200, "Admin stats", data));
}

export async function getAdminJobs(
  req: Request,
  res: Response,
): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(50, Math.max(1, Number(req.query.size) || 10));
  const data = await jobsService.getAdminJobs(page, size);
  res.json(new ApiResponse(200, "Admin jobs", data));
}

export async function createJob(req: Request, res: Response): Promise<void> {
  const adminId = req.params.adminId;
  const body = createJobSchema.parse(req.body);
  const data = await jobsService.createJob(adminId, body);
  res.status(201).json(new ApiResponse(201, "Job created", data));
}

export async function updateJob(req: Request, res: Response): Promise<void> {
  const jobId = Number(req.params.jobId);
  const body = createJobSchema.parse(req.body);
  const data = await jobsService.updateJob(jobId, body);
  res.json(new ApiResponse(200, "Job updated", data));
}

export async function deleteJob(req: Request, res: Response): Promise<void> {
  const jobId = Number(req.params.jobId);
  await jobsService.deleteJob(jobId);
  res.json(new ApiResponse(200, "Job deleted", null));
}

export async function toggleJobStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const jobId = Number(req.params.jobId);
  const isActive = req.query.isActive === "true";
  const data = await jobsService.toggleJobStatus(jobId, isActive);
  res.json(new ApiResponse(200, "Job status updated", data));
}

export async function updateApplicationStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const applicationId = Number(req.params.applicationId);
  const { status } = updateApplicationStatusSchema.parse({
    status: req.query.status,
    notes: req.query.notes,
  });
  const data = await jobsService.updateApplicationStatus(
    applicationId,
    status,
  );
  res.json(new ApiResponse(200, "Application status updated", data));
}

// Laptops API AdminController
import { UserRepository } from "../auth/user.repository.js";
export const AdminController = {
  getAllUsers: async (req: Request, res: Response): Promise<void> => {
    const users = await UserRepository.getAllUsers();
    res.status(200).json({ success: true, message: "Users fetched", data: users });
  },
  updateUserRole: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { role } = req.body;
    const user = await UserRepository.updateUser(id, { role });
    res.status(200).json({ success: true, message: "User role updated", data: user });
  },
  updateUserStatus: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    const user = await UserRepository.updateUser(id, { status });
    res.status(200).json({ success: true, message: "User status updated", data: user });
  }
};

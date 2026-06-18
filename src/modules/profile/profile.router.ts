import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import * as profileController from "./profile.controller.js";

export const profileRouter = Router();

// Multer config for resume upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/resumes");
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Only PDF, DOC, DOCX files are allowed") as any);
    }
  },
});

// Full profile
profileRouter.get(
  "/:userId",
  requireAuth,
  asyncHandler(profileController.getProfile),
);
profileRouter.put(
  "/:userId",
  requireAuth,
  asyncHandler(profileController.updateProfile),
);
profileRouter.put(
  "/:userId/basic",
  requireAuth,
  asyncHandler(profileController.updateProfile),
);

// Headline + Summary
profileRouter.put(
  "/:userId/headline",
  requireAuth,
  asyncHandler(profileController.updateHeadline),
);
profileRouter.put(
  "/:userId/summary",
  requireAuth,
  asyncHandler(profileController.updateSummary),
);

// Personal details
profileRouter.get(
  "/:userId/personal-details",
  requireAuth,
  asyncHandler(profileController.getPersonalDetails),
);
profileRouter.put(
  "/:userId/personal-details",
  requireAuth,
  asyncHandler(profileController.updatePersonalDetails),
);

// Employment CRUD
profileRouter.get(
  "/:userId/employments",
  requireAuth,
  asyncHandler(profileController.getEmployments),
);
profileRouter.post(
  "/:userId/employments",
  requireAuth,
  asyncHandler(profileController.createEmployment),
);
profileRouter.put(
  "/:userId/employments/:employmentId",
  requireAuth,
  asyncHandler(profileController.updateEmployment),
);
profileRouter.delete(
  "/:userId/employments/:employmentId",
  requireAuth,
  asyncHandler(profileController.deleteEmployment),
);

// Education CRUD
profileRouter.get(
  "/:userId/educations",
  requireAuth,
  asyncHandler(profileController.getEducations),
);
profileRouter.post(
  "/:userId/educations",
  requireAuth,
  asyncHandler(profileController.createEducation),
);
profileRouter.put(
  "/:userId/educations/:educationId",
  requireAuth,
  asyncHandler(profileController.updateEducation),
);
profileRouter.delete(
  "/:userId/educations/:educationId",
  requireAuth,
  asyncHandler(profileController.deleteEducation),
);

// Projects CRUD
profileRouter.get(
  "/:userId/projects",
  requireAuth,
  asyncHandler(profileController.getProjects),
);
profileRouter.post(
  "/:userId/projects",
  requireAuth,
  asyncHandler(profileController.createProject),
);
profileRouter.put(
  "/:userId/projects/:projectId",
  requireAuth,
  asyncHandler(profileController.updateProject),
);
profileRouter.delete(
  "/:userId/projects/:projectId",
  requireAuth,
  asyncHandler(profileController.deleteProject),
);

// IT Skills CRUD
profileRouter.get(
  "/:userId/it-skills",
  requireAuth,
  asyncHandler(profileController.getItSkills),
);
profileRouter.post(
  "/:userId/it-skills",
  requireAuth,
  asyncHandler(profileController.createItSkill),
);
profileRouter.put(
  "/:userId/it-skills/:skillId",
  requireAuth,
  asyncHandler(profileController.updateItSkill),
);
profileRouter.delete(
  "/:userId/it-skills/:skillId",
  requireAuth,
  asyncHandler(profileController.deleteItSkill),
);

// Resume
profileRouter.post(
  "/:userId/resume",
  requireAuth,
  upload.single("resume"),
  asyncHandler(profileController.uploadResume),
);
profileRouter.delete(
  "/:userId/resume",
  requireAuth,
  asyncHandler(profileController.deleteResume),
);

// Email change (OTP)
profileRouter.post(
  "/:userId/email/initiate",
  requireAuth,
  asyncHandler(profileController.initiateEmailChange),
);
profileRouter.post(
  "/:userId/email/verify",
  requireAuth,
  asyncHandler(profileController.verifyEmailChange),
);

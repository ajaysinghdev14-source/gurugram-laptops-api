import { z } from "zod";

export const jobSearchSchema = z.object({
  keyword: z.string().optional(),
  locationType: z
    .enum(["REMOTE", "ONSITE", "HYBRID"])
    .optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "FREELANCE", "CONTRACT"])
    .optional(),
  cityId: z.number().int().positive().optional(),
  experienceLevel: z.number().int().min(0).optional(),
  salaryMin: z.number().int().min(0).optional(),
  page: z.number().int().min(1).optional(),
  size: z.number().int().min(1).max(50).optional(),
  userId: z.string().uuid().optional(),
});

export const applyJobSchema = z.object({
  coverLetter: z.string().max(2000).optional(),
});

export const createJobSchema = z.object({
  title: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  companyLogo: z.string().max(512).optional().nullable(),
  description: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  cityId: z.number().int().positive().optional().nullable(),
  locationType: z
    .enum(["REMOTE", "ONSITE", "HYBRID"])
    .optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "FREELANCE", "CONTRACT"])
    .optional(),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  isSalaryDisclosed: z.boolean().optional(),
  experienceMinYears: z.number().int().min(0).optional(),
  experienceMaxYears: z.number().int().min(0).optional().nullable(),
  minEducation: z.string().max(30).optional().nullable(),
  vacancies: z.number().int().min(1).optional(),
  applicationDeadline: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  skillIds: z.array(z.number().int().positive()).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "REVIEWED",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "REJECTED",
    "HIRED",
  ]),
  notes: z.string().max(1000).optional(),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;

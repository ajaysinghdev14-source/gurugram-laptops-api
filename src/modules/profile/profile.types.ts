import { z } from "zod";

// Basic profile update
export const updateBasicProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  educationLevel: z
    .enum([
      "BELOW_10TH",
      "PASS_10TH",
      "PASS_12TH",
      "DIPLOMA",
      "GRADUATE",
      "POST_GRADUATE",
    ])
    .optional(),
  hasExperience: z.boolean().optional(),
  experienceLevel: z
    .enum([
      "FRESHER",
      "MONTHS_1_6",
      "YEAR_1",
      "YEARS_2",
      "YEARS_3",
      "YEARS_4",
      "YEARS_5_PLUS",
    ])
    .optional()
    .nullable(),
  currentSalary: z.number().int().min(0).optional().nullable(),
  preferredCityId: z.number().int().positive().optional(),
  preferredLocalityId: z.number().int().positive().optional().nullable(),
  cityId: z.number().int().positive().optional(), // alias for preferredCityId (frontend)
  localityId: z.number().int().positive().optional().nullable(), // alias for preferredLocalityId (frontend)
  noticePeriod: z.string().max(30).optional().nullable(),
  headline: z.string().max(250).optional().nullable(),
  preferredRoleId: z.number().int().positive().optional(),
  whatsappUpdates: z.boolean().optional(),
});

// Personal details
export const personalDetailsSchema = z.object({
  dateOfBirth: z.string().optional().nullable(),
  maritalStatus: z
    .enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"])
    .optional()
    .nullable(),
  address: z.string().max(500).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  nationality: z.string().max(50).optional().nullable(),
});

// Headline
export const headlineSchema = z.object({
  headline: z.string().max(250),
});

// Summary
export const summarySchema = z.object({
  summary: z.string().max(2000),
});

// Employment
export const employmentSchema = z.object({
  designation: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "FREELANCE", "CONTRACT"])
    .optional(),
  isCurrent: z.boolean().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  noticePeriod: z.string().max(30).optional().nullable(),
});

// Education
export const educationSchema = z.object({
  degree: z.string().min(1).max(100),
  specialization: z.string().max(100).optional().nullable(),
  institution: z.string().min(1).max(255),
  passOutYear: z.number().int().min(1970).max(2040).optional().nullable(),
  gradeType: z.enum(["CGPA", "PERCENTAGE", "GRADE"]).optional().nullable(),
  grade: z.string().max(20).optional().nullable(),
});

// Project
export const projectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isOngoing: z.boolean().optional(),
  projectUrl: z.string().max(512).optional().nullable(),
});

// IT Skill
export const itSkillSchema = z.object({
  name: z.string().min(1).max(100),
  proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERT"]).optional(),
  experienceMonths: z.number().int().min(0).optional(),
});

export type UpdateBasicProfile = z.infer<typeof updateBasicProfileSchema>;
export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
export type EmploymentInput = z.infer<typeof employmentSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ItSkillInput = z.infer<typeof itSkillSchema>;

export const initiateEmailChangeSchema = z.object({
  newEmail: z.string().email(),
});

export const verifyEmailChangeSchema = z.object({
  newEmail: z.string().email(),
  otp: z.string().length(6),
});

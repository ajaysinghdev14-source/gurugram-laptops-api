import { z } from "zod";

export const saveProfileBodySchema = z.object({
  fullName: z.string().min(1).max(255),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  educationLevel: z.enum([
    "BELOW_10TH",
    "PASS_10TH",
    "PASS_12TH",
    "DIPLOMA",
    "GRADUATE",
    "POST_GRADUATE",
  ]),
  hasExperience: z.boolean(),
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
    .optional(),
  currentSalary: z.number().int().min(0).optional(),
  preferredCityId: z.number().int().positive(),
  preferredLocalityId: z.number().int().positive().optional(),
  whatsappUpdates: z.boolean().optional(),
});

export const savePreferencesBodySchema = z.object({
  preferredRoleId: z.number().int().positive(),
  skillIds: z.array(z.number().int().positive()).min(1).max(20),
});

export type SaveProfileBody = z.infer<typeof saveProfileBodySchema>;
export type SavePreferencesBody = z.infer<typeof savePreferencesBodySchema>;

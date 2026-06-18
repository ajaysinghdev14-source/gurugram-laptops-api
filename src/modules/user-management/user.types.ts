import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

export const registerBodySchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: passwordSchema,
  name: z.string().min(1, "Name is required").max(255),
});

export const loginBodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailBodySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const resendVerifyEmailBodySchema = z.object({
  email: z.string().email("Invalid email"),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: passwordSchema,
});

export const googleAuthBodySchema = z.object({
  idToken: z.string().min(1, "Google id_token is required"),
});

const phoneSchema = z
  .string()
  .min(10, "Phone number is required")
  .max(20);

export const requestOtpBodySchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpBodySchema = z.object({
  phone: phoneSchema,
  code: z
    .string()
    .min(1, "Code is required")
    .refine((s) => /^\d{6}$/.test(s.trim()), "Code must be 6 digits"),
});

export const linkPhoneBodySchema = z.object({
  phone: phoneSchema,
  code: z
    .string()
    .min(1, "Code is required")
    .refine((s) => /^\d{6}$/.test(s.trim()), "Code must be 6 digits"),
});

export const linkEmailBodySchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  name: z.string().min(1).max(255).optional(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  name: z.string(),
  avatarUrl: z.string().url().nullable(),
  role: z.string(),
  emailVerifiedAt: z.date().nullable(),
  phoneVerifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const authResponseSchema = z.object({
  user: userResponseSchema,
  accessToken: z.string(),
  expiresIn: z.string().optional(),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
export type ResendVerifyEmailBody = z.infer<typeof resendVerifyEmailBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type GoogleAuthBody = z.infer<typeof googleAuthBodySchema>;
export type RequestOtpBody = z.infer<typeof requestOtpBodySchema>;
export type VerifyOtpBody = z.infer<typeof verifyOtpBodySchema>;
export type LinkPhoneBody = z.infer<typeof linkPhoneBodySchema>;
export type LinkEmailBody = z.infer<typeof linkEmailBodySchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

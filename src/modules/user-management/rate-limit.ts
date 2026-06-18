import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

function msg(message: string) {
  return { success: false, statusCode: 429, message, errors: [] };
}

function normalizePhoneForKey(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function getOtpIdentifier(req: Request): string {
  const phone = req.body?.phone as string | undefined;
  if (phone && /^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
    return normalizePhoneForKey(phone);
  }
  const raw =
    phone ??
    (req.body?.email as string | undefined) ??
    (req.body?.identifier as string | undefined) ??
    "";
  return raw.trim().toLowerCase();
}

function getIp(req: Request): string {
  return req.ip ?? "127.0.0.1";
}

const isTest = process.env.NODE_ENV === "test";
const testMax = 10000;

/**
 * Base auth limiter (IP-based) for everything under /api/auth
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? testMax : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many requests, try again later."),
});

/**
 * Stricter limits for sensitive endpoints
 */
export const authRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? testMax : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many register attempts, try again later."),
});

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? testMax : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many login attempts, try again later."),
});

/**
 * OTP request limits (recommended):
 * - Cooldown: 1/min per phone/email
 * - Burst: 3 per 5 min per phone/email
 * - Daily cap: 10/day per phone/email
 * - IP backstop: 30 per 15 min per IP
 *
 * Note: express-rate-limit default store is in-memory (per-process).
 * For production multi-instance: use a shared store (Redis) later.
 */

export const otpRequestCooldownLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `otp:req:cooldown:${getOtpIdentifier(req) || ipKeyGenerator(getIp(req))}`,
  message: msg("Please wait 1 minute before requesting another OTP."),
});

export const otpRequestBurstPerIdentifierLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `otp:req:burst:${getOtpIdentifier(req) || ipKeyGenerator(getIp(req))}`,
  message: msg("Too many OTP requests. Try again in 5 minutes."),
});

export const otpRequestDailyPerIdentifierLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `otp:req:daily:${getOtpIdentifier(req) || ipKeyGenerator(getIp(req))}`,
  message: msg("Daily OTP request limit reached. Try again tomorrow."),
});

export const otpRequestPerIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `otp:req:ip:${ipKeyGenerator(getIp(req))}`,
  message: msg("Too many OTP requests from this IP. Try again later."),
});

/**
 * OTP verify limits:
 * - IP backstop: 50 per 15 min per IP
 * (Plus: enforce 5 attempts per OTP in DB when we implement OTP tokens.)
 */

export const otpVerifyPerIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `otp:verify:ip:${ipKeyGenerator(getIp(req))}`,
  message: msg("Too many OTP attempts. Try again later."),
});

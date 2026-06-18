import type { Request, Response } from "express";
import { ApiError } from "../../utils/apiError.js";
import { env } from "../../config/env.js";
import {
  registerBodySchema,
  loginBodySchema,
  verifyEmailBodySchema,
  resendVerifyEmailBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  googleAuthBodySchema,
  requestOtpBodySchema,
  verifyOtpBodySchema,
  linkPhoneBodySchema,
  linkEmailBodySchema,
} from "./user.types.js";
import * as userService from "./user.service.js";
import * as tokenService from "./token.service.js";
import * as emailService from "./email.service.js";
import { verifyGoogleIdToken } from "./googleAuth.service.js";
import { sendOtpSms, isTwilioConfigured } from "./twilio.service.js";

const COOKIE_REFRESH = "refreshToken";
const COOKIE_ACCESS = "accessToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const COOKIE_ACCESS_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 15 * 60 * 1000,
};

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );

  const data = parsed.data;
  const existing = await userService.getByEmail(data.email);
  if (existing) throw new ApiError(409, "Email already registered");

  const user = await userService.register(data);
  const accessToken = tokenService.issueAccessToken(user.id, user.email ?? user.phone ?? user.id);
  const refreshToken = await tokenService.issueRefreshToken(
    user.id,
    req.get("User-Agent") ?? undefined,
  );

  res.cookie(COOKIE_ACCESS, accessToken, COOKIE_ACCESS_OPTIONS);
  res.cookie(COOKIE_REFRESH, refreshToken, COOKIE_OPTIONS);
  res.status(201).json({
    success: true,
    statusCode: 201,
    message: "Registered",
    data: { user, accessToken, refreshToken, expiresIn: "15m" },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );

  const { email, password } = parsed.data;
  const user = await userService.login(email, password);
  if (!user) throw new ApiError(401, "Invalid email or password");

  const accessToken = tokenService.issueAccessToken(user.id, user.email ?? user.phone ?? user.id);
  const refreshToken = await tokenService.issueRefreshToken(
    user.id,
    req.get("User-Agent") ?? undefined,
  );

  res.cookie(COOKIE_ACCESS, accessToken, COOKIE_ACCESS_OPTIONS);
  res.cookie(COOKIE_REFRESH, refreshToken, COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Logged in",
    data: { user, accessToken, refreshToken, expiresIn: "15m" },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[COOKIE_REFRESH] ?? req.body?.refreshToken;
  if (token) await tokenService.revokeRefreshToken(token);
  res.clearCookie(COOKIE_ACCESS);
  res.clearCookie(COOKIE_REFRESH);
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Logged out",
    data: null,
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[COOKIE_REFRESH] ?? req.body?.refreshToken;
  if (!token) throw new ApiError(401, "Refresh token required");

  const result = await tokenService.verifyAndRotateRefreshToken(
    token,
    req.get("User-Agent") ?? undefined,
  );
  if (!result) throw new ApiError(401, "Invalid or expired refresh token");

  const user = await userService.getById(result.userId);
  if (!user) throw new ApiError(401, "User not found");

  const accessToken = tokenService.issueAccessToken(user.id, user.email ?? user.phone ?? user.id);
  res.cookie(COOKIE_ACCESS, accessToken, COOKIE_ACCESS_OPTIONS);
  res.cookie(COOKIE_REFRESH, result.newRefreshToken, COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Token refreshed",
    data: { user, accessToken, refreshToken: result.newRefreshToken, expiresIn: "15m" },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  const user = await userService.getById(req.user.userId);
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "OK",
    data: { user },
  });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const parsed = verifyEmailBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  const { token } = parsed.data;
  const result = await tokenService.consumeEmailVerifyToken(token);
  if (!result)
    throw new ApiError(400, "Invalid or expired verification link");
  const updated = await userService.setEmailVerifiedByEmail(result.email);
  if (!updated) throw new ApiError(400, "User not found");
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Email verified",
    data: null,
  });
}

export async function resendVerifyEmail(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = resendVerifyEmailBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  const { email } = parsed.data;
  const user = await userService.getByEmail(email);
  if (!user) {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "If an account exists, a verification link was sent.",
      data: null,
    });
    return;
  }
  if (user.emailVerifiedAt) {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Email is already verified.",
      data: null,
    });
    return;
  }
  const rawToken = await tokenService.createEmailVerifyToken(user.email!);
  const verifyLink = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;
  await emailService.sendVerificationEmail(user.email!, verifyLink);
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "If an account exists, a verification link was sent.",
    data: null,
  });
}

export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = forgotPasswordBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  const { email } = parsed.data;
  const user = await userService.getByEmail(email);
  if (!user) {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "If an account exists, a password reset link was sent.",
      data: null,
    });
    return;
  }
  if (!user.passwordHash) {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "If an account exists, a password reset link was sent.",
      data: null,
    });
    return;
  }
  const rawToken = await tokenService.createPasswordResetToken(user.email!);
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await emailService.sendPasswordResetEmail(user.email!, resetLink);
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "If an account exists, a password reset link was sent.",
    data: null,
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  const { token, newPassword } = parsed.data;
  const result = await tokenService.consumePasswordResetToken(token);
  if (!result)
    throw new ApiError(400, "Invalid or expired password reset link");
  const updated = await userService.updatePasswordByEmail(
    result.email,
    newPassword,
  );
  if (!updated) throw new ApiError(400, "User not found");
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Password has been reset. You can now log in.",
    data: null,
  });
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const parsed = googleAuthBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );

  let payload;
  try {
    payload = await verifyGoogleIdToken(parsed.data.idToken);
  } catch (e) {
    const err = e as Error & { statusCode?: number };
    throw new ApiError(
      err.statusCode === 503 ? 503 : 401,
      err.message || "Invalid Google token",
    );
  }

  const user = await userService.findOrCreateGoogleUser(payload);
  const accessToken = tokenService.issueAccessToken(user.id, user.email ?? user.phone ?? user.id);
  const refreshToken = await tokenService.issueRefreshToken(
    user.id,
    req.get("User-Agent") ?? undefined,
  );

  res.cookie(COOKIE_ACCESS, accessToken, COOKIE_ACCESS_OPTIONS);
  res.cookie(COOKIE_REFRESH, refreshToken, COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Logged in",
    data: { user, accessToken, refreshToken, expiresIn: "15m" },
  });
}

export async function requestOtp(req: Request, res: Response): Promise<void> {
  const parsed = requestOtpBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );

  if (!isTwilioConfigured())
    throw new ApiError(503, "SMS is not configured");

  const normalized = userService.normalizePhone(parsed.data.phone);
  const code = await tokenService.createPhoneOtpToken(normalized);

  try {
    await sendOtpSms(normalized, code);
  } catch (e) {
    const err = e as { message?: string; code?: number };
    const msg = err.message ?? "Failed to send SMS";
    const twilioCode = err.code;
    const twilioHint =
      "Ensure the number is verified in Twilio Console (Phone Numbers → Verified Caller IDs) in E.164 format, e.g. +18808319836 (no spaces).";
    if (twilioCode === 21211 || twilioCode === 21614 || (msg.includes("Invalid") && msg.toLowerCase().includes("phone"))) {
      throw new ApiError(400, `${msg} ${twilioHint}`);
    }
    throw new ApiError(400, msg);
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "If this number is valid, an OTP was sent.",
    data: null,
  });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const parsed = verifyOtpBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );

  const normalized = userService.normalizePhone(parsed.data.phone);
  const result = await tokenService.consumePhoneOtpToken(
    normalized,
    parsed.data.code,
  );
  if (!result)
    throw new ApiError(400, "Invalid or expired code");

  const user = await userService.findOrCreatePhoneUser(result.phone);
  const accessToken = tokenService.issueAccessToken(user.id, user.email ?? user.phone ?? user.id);
  const refreshToken = await tokenService.issueRefreshToken(
    user.id,
    req.get("User-Agent") ?? undefined,
  );

  res.cookie(COOKIE_ACCESS, accessToken, COOKIE_ACCESS_OPTIONS);
  res.cookie(COOKIE_REFRESH, refreshToken, COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Logged in",
    data: { user, accessToken, refreshToken, expiresIn: "15m" },
  });
}

export async function linkPhone(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Unauthorized");

  const parsed = linkPhoneBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );

  const normalized = userService.normalizePhone(parsed.data.phone);
  const result = await tokenService.consumePhoneOtpToken(
    normalized,
    parsed.data.code,
  );
  if (!result)
    throw new ApiError(400, "Invalid or expired OTP code");

  try {
    const user = await userService.linkPhoneToUser(req.user.userId, result.phone);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Phone linked successfully",
      data: { user },
    });
  } catch (e) {
    const err = e as Error & { statusCode?: number };
    if (err.statusCode === 409) throw new ApiError(409, err.message);
    throw e;
  }
}

export async function linkEmail(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Unauthorized");

  const parsed = linkEmailBodySchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );

  const { email, password, name } = parsed.data;

  try {
    const user = await userService.linkEmailToUser(
      req.user.userId,
      email,
      password,
      name,
    );

    const rawToken = await tokenService.createEmailVerifyToken(email);
    const verifyLink = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;
    await emailService.sendVerificationEmail(email, verifyLink);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Email linked successfully. Verification email sent.",
      data: { user },
    });
  } catch (e) {
    const err = e as Error & { statusCode?: number };
    if (err.statusCode === 409) throw new ApiError(409, err.message);
    throw e;
  }
}

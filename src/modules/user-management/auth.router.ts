import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import * as authController from "./auth.controller.js";
import {
  authLoginLimiter,
  authRegisterLimiter,
  otpRequestCooldownLimiter,
  otpRequestBurstPerIdentifierLimiter,
  otpRequestDailyPerIdentifierLimiter,
  otpRequestPerIpLimiter,
  otpVerifyPerIpLimiter,
} from "./rate-limit.js";

const router = Router();

router.post(
  "/register",
  authRegisterLimiter,
  asyncHandler(authController.register),
);
router.post("/login", authLoginLimiter, asyncHandler(authController.login));
router.post(
  "/google",
  authLoginLimiter,
  asyncHandler(authController.googleAuth),
);
router.post("/logout", asyncHandler(authController.logout));
router.post("/refresh", asyncHandler(authController.refresh));
router.get("/me", requireAuth, asyncHandler(authController.me));
router.post("/verify-email", asyncHandler(authController.verifyEmail));
router.post(
  "/resend-verify-email",
  asyncHandler(authController.resendVerifyEmail),
);
router.post("/forgot-password", asyncHandler(authController.forgotPassword));
router.post("/reset-password", asyncHandler(authController.resetPassword));
router.post(
  "/request-otp",
  otpRequestPerIpLimiter,
  otpRequestCooldownLimiter,
  otpRequestBurstPerIdentifierLimiter,
  otpRequestDailyPerIdentifierLimiter,
  asyncHandler(authController.requestOtp),
);
router.post(
  "/verify-otp",
  otpVerifyPerIpLimiter,
  asyncHandler(authController.verifyOtp),
);
router.post(
  "/link-phone",
  requireAuth,
  asyncHandler(authController.linkPhone),
);
router.post(
  "/link-email",
  requireAuth,
  asyncHandler(authController.linkEmail),
);

export const authRouter = router;

import { Resend } from "resend";
import { env } from "../../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(
  to: string,
  verifyLink: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[dev] Verify email link for ${to}: ${verifyLink}`);
    }
    return { ok: true };
  }
  const { error } = await resend.emails.send({
    from: env.FROM_EMAIL,
    to: [to],
    subject: "Verify your email — SortOut Jobs",
    html: `
      <p>Hi,</p>
      <p>Click the link below to verify your email:</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
      <p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
      <p>— SortOut Jobs</p>
    `,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[dev] Password reset link for ${to}: ${resetLink}`);
    }
    return { ok: true };
  }
  const { error } = await resend.emails.send({
    from: env.FROM_EMAIL,
    to: [to],
    subject: "Reset your password — SortOut Jobs",
    html: `
      <p>Hi,</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      <p>— SortOut Jobs</p>
    `,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendEmailChangeOtp(
  to: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[dev] Email change OTP for ${to}: ${code}`);
    }
    return { ok: true };
  }
  const { error } = await resend.emails.send({
    from: env.FROM_EMAIL,
    to: [to],
    subject: "Verify your new email — SortOut Jobs",
    html: `
      <p>Hi,</p>
      <p>Your verification code to update your email is:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      <p>— SortOut Jobs</p>
    `,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

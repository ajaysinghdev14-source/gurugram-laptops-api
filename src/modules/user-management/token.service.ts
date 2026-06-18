import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { authTokens, refreshTokens } from "../../db/schema/index.js";
import { env } from "../../config/env.js";

const REFRESH_TOKEN_BYTES = 32;

function parseExpiryToMs(expiry: string): number {
  const match = expiry.trim().match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return n * (multipliers[unit] ?? 86400000);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function issueAccessToken(userId: string, identifier: string): string {
  return jwt.sign(
    { sub: userId, identifier, type: "access" },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY } as jwt.SignOptions,
  );
}

export async function issueRefreshToken(
  userId: string,
  deviceInfo?: string,
): Promise<string> {
  const raw = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(
    Date.now() + parseExpiryToMs(env.REFRESH_TOKEN_EXPIRY),
  );

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    deviceInfo: deviceInfo ?? null,
    expiresAt,
  });

  return raw;
}

export function verifyAccessToken(token: string): {
  userId: string;
  identifier: string;
} {
  const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as {
    sub: string;
    identifier?: string;
    email?: string;
  };
  return { userId: payload.sub, identifier: payload.identifier ?? payload.email ?? "" };
}

export async function verifyAndRotateRefreshToken(
  rawToken: string,
  deviceInfo?: string,
): Promise<{ userId: string; newRefreshToken: string } | null> {
  const tokenHash = hashToken(rawToken);
  const rows = await db
    .select({
      userId: refreshTokens.userId,
      id: refreshTokens.id,
      expiresAt: refreshTokens.expiresAt,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  const row = rows[0];
  if (!row || new Date() > row.expiresAt) return null;

  await db.delete(refreshTokens).where(eq(refreshTokens.id, row.id));
  const newRefreshToken = await issueRefreshToken(row.userId, deviceInfo);
  return { userId: row.userId, newRefreshToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  const deleted = await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .returning({ id: refreshTokens.id });
  return deleted.length > 0;
}

const AUTH_TOKEN_BYTES = 32;
const EMAIL_VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

export async function createEmailVerifyToken(email: string): Promise<string> {
  const raw = crypto.randomBytes(AUTH_TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_EXPIRY_MS);
  const identifier = email.toLowerCase().trim();
  await db.insert(authTokens).values({
    type: "email_verify",
    identifier,
    tokenHash,
    expiresAt,
  });
  return raw;
}

export async function consumeEmailVerifyToken(
  rawToken: string,
): Promise<{ email: string } | null> {
  const tokenHash = hashToken(rawToken);
  const rows = await db
    .select({ id: authTokens.id, identifier: authTokens.identifier, expiresAt: authTokens.expiresAt })
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, "email_verify"),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row || new Date() > row.expiresAt) return null;
  await db.delete(authTokens).where(eq(authTokens.id, row.id));
  return { email: row.identifier };
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const raw = crypto.randomBytes(AUTH_TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
  const identifier = email.toLowerCase().trim();
  await db.insert(authTokens).values({
    type: "password_reset",
    identifier,
    tokenHash,
    expiresAt,
  });
  return raw;
}

export async function consumePasswordResetToken(
  rawToken: string,
): Promise<{ email: string } | null> {
  const tokenHash = hashToken(rawToken);
  const rows = await db
    .select({ id: authTokens.id, identifier: authTokens.identifier, expiresAt: authTokens.expiresAt })
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, "password_reset"),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row || new Date() > row.expiresAt) return null;
  await db.delete(authTokens).where(eq(authTokens.id, row.id));
  return { email: row.identifier };
}

const PHONE_OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export async function createPhoneOtpToken(phone: string): Promise<string> {
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const tokenHash = hashToken(code);
  const expiresAt = new Date(Date.now() + PHONE_OTP_EXPIRY_MS);
  const identifier = phone.trim();
  await db.insert(authTokens).values({
    type: "phone_otp",
    identifier,
    tokenHash,
    expiresAt,
  });
  return code;
}

export async function consumePhoneOtpToken(
  phone: string,
  code: string,
): Promise<{ phone: string } | null> {
  const tokenHash = hashToken(code.trim());
  const identifier = phone.trim();
  const rows = await db
    .select({ id: authTokens.id, expiresAt: authTokens.expiresAt })
    .from(authTokens)
    .where(
      and(
        eq(authTokens.type, "phone_otp"),
        eq(authTokens.identifier, identifier),
        eq(authTokens.tokenHash, tokenHash),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row || new Date() > row.expiresAt) return null;
  await db.delete(authTokens).where(eq(authTokens.id, row.id));
  return { phone: identifier };
}

const EMAIL_CHANGE_OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export async function createEmailChangeOtpToken(
  userId: string,
  newEmail: string,
): Promise<{ code: string; expiresInSeconds: number }> {
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const tokenHash = hashToken(code);
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_OTP_EXPIRY_MS);
  const identifier = `${userId}:${newEmail.toLowerCase().trim()}`;
  await db.insert(authTokens).values({
    type: "email_change",
    identifier,
    tokenHash,
    expiresAt,
  });
  return { code, expiresInSeconds: Math.floor(EMAIL_CHANGE_OTP_EXPIRY_MS / 1000) };
}

export async function consumeEmailChangeOtpToken(
  userId: string,
  newEmail: string,
  code: string,
): Promise<{ newEmail: string } | null> {
  const tokenHash = hashToken(code.trim());
  const identifier = `${userId}:${newEmail.toLowerCase().trim()}`;
  const rows = await db
    .select({ id: authTokens.id, expiresAt: authTokens.expiresAt })
    .from(authTokens)
    .where(
      and(
        eq(authTokens.type, "email_change"),
        eq(authTokens.identifier, identifier),
        eq(authTokens.tokenHash, tokenHash),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row || new Date() > row.expiresAt) return null;
  await db.delete(authTokens).where(eq(authTokens.id, row.id));
  return { newEmail: newEmail.toLowerCase().trim() };
}

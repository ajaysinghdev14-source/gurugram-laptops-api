import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema/index.js";
import type { RegisterBody, UserResponse } from "./user.types.js";
import type { GoogleTokenPayload } from "./googleAuth.service.js";

const SALT_ROUNDS = 10;

function toUserResponse(row: {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatarUrl: string | null;
  role: string;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse {
  return {
    id: row.id,
    email: row.email ?? null,
    phone: row.phone ?? null,
    name: row.name,
    avatarUrl: row.avatarUrl ? row.avatarUrl : null,
    role: row.role,
    emailVerifiedAt: row.emailVerifiedAt,
    phoneVerifiedAt: row.phoneVerifiedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function register(data: RegisterBody): Promise<UserResponse> {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const inserted = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase().trim(),
      passwordHash,
      name: data.name.trim(),
      provider: "email",
    })
    .returning({
      id: users.id,
      email: users.email,
      phone: users.phone,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });
  const row = inserted[0];
  if (!row) throw new Error("Insert failed");
  return toUserResponse(row);
}

export async function getByEmail(email: string): Promise<{
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  role: string;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

/** Normalize to E.164: digits only, 10 digits => +1 prefix (US). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export async function getByPhone(phone: string): Promise<{
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatarUrl: string | null;
  role: string;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const normalized = normalizePhone(phone);
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.phone, normalized))
    .limit(1);
  return rows[0] ?? null;
}

export async function findOrCreatePhoneUser(phone: string): Promise<UserResponse> {
  const normalized = normalizePhone(phone);
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalized))
    .limit(1);
  const row = existing[0];
  const now = new Date();

  if (row) {
    const updated = await db
      .update(users)
      .set({ provider: "phone", phoneVerifiedAt: now, updatedAt: now })
      .where(eq(users.id, row.id))
      .returning({
        id: users.id,
        email: users.email,
        phone: users.phone,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        emailVerifiedAt: users.emailVerifiedAt,
        phoneVerifiedAt: users.phoneVerifiedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    const out = updated[0];
    if (!out) throw new Error("Update failed");
    return toUserResponse(out);
  }

  const inserted = await db
    .insert(users)
    .values({
      email: null,
      phone: normalized,
      passwordHash: null,
      name: "User",
      provider: "phone",
      phoneVerifiedAt: now,
    })
    .returning({
      id: users.id,
      email: users.email,
      phone: users.phone,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });
  const newRow = inserted[0];
  if (!newRow) throw new Error("Insert failed");
  return toUserResponse(newRow);
}

export async function login(
  email: string,
  password: string,
): Promise<UserResponse | null> {
  const user = await getByEmail(email);
  if (!user || !user.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return toUserResponse(user);
}

export async function getById(id: string): Promise<UserResponse | null> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const row = rows[0];
  return row ? toUserResponse(row) : null;
}

export async function setEmailVerifiedByEmail(email: string): Promise<boolean> {
  const result = await db
    .update(users)
    .set({
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.email, email.toLowerCase().trim()))
    .returning({ id: users.id });
  return result.length > 0;
}

export async function updatePasswordByEmail(
  email: string,
  newPassword: string,
): Promise<boolean> {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const result = await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.email, email.toLowerCase().trim()))
    .returning({ id: users.id });
  return result.length > 0;
}

export async function findOrCreateGoogleUser(
  payload: GoogleTokenPayload,
): Promise<UserResponse> {
  const email = payload.email.toLowerCase().trim();
  const existing = await getByEmail(email);
  const now = new Date();

  if (existing) {
    const updated = await db
      .update(users)
      .set({
        provider: "google",
        name: payload.name.trim() || existing.name,
        avatarUrl: payload.picture ?? existing.avatarUrl,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id))
      .returning({
        id: users.id,
        email: users.email,
        phone: users.phone,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        emailVerifiedAt: users.emailVerifiedAt,
        phoneVerifiedAt: users.phoneVerifiedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    const row = updated[0];
    if (!row) throw new Error("Update failed");
    return toUserResponse(row);
  }

  const inserted = await db
    .insert(users)
    .values({
      email,
      passwordHash: null,
      name: payload.name.trim(),
      avatarUrl: payload.picture ?? null,
      provider: "google",
      emailVerifiedAt: now,
    })
    .returning({
      id: users.id,
      email: users.email,
      phone: users.phone,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });
  const row = inserted[0];
  if (!row) throw new Error("Insert failed");
  return toUserResponse(row);
}

export async function linkPhoneToUser(
  userId: string,
  phone: string,
): Promise<UserResponse> {
  const normalized = normalizePhone(phone);

  const conflict = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, normalized))
    .limit(1);
  if (conflict[0] && conflict[0].id !== userId) {
    throw Object.assign(new Error("Phone already linked to another account"), { statusCode: 409 });
  }

  const now = new Date();
  const updated = await db
    .update(users)
    .set({ phone: normalized, phoneVerifiedAt: now, updatedAt: now })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      phone: users.phone,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });
  const out = updated[0];
  if (!out) throw new Error("User not found");
  return toUserResponse(out);
}

export async function linkEmailToUser(
  userId: string,
  email: string,
  password: string,
  name?: string,
): Promise<UserResponse> {
  const normalizedEmail = email.toLowerCase().trim();

  const conflict = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (conflict[0] && conflict[0].id !== userId) {
    throw Object.assign(new Error("Email already linked to another account"), { statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date();
  const setValues: Record<string, unknown> = {
    email: normalizedEmail,
    passwordHash,
    updatedAt: now,
  };
  if (name) setValues.name = name.trim();

  const updated = await db
    .update(users)
    .set(setValues)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      phone: users.phone,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });
  const out = updated[0];
  if (!out) throw new Error("User not found");
  return toUserResponse(out);
}

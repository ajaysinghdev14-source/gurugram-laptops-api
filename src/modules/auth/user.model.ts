import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Users ──────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  fullName: varchar('full_name', { length: 255 }),
  password: varchar('password', { length: 255 }),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  refreshToken: varchar('refresh_token', { length: 255 }),
  isEmailVerified: boolean('is_email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordTokenExpires: timestamp('reset_password_token_expires'),

  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }).default(''),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
  provider: varchar('provider', { length: 20 }).notNull().default('email'),
  
  role: varchar('role', { length: 50 }).default('USER'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Refresh Tokens ─────────────────────────────────
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    deviceInfo: varchar("device_info", { length: 255 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("refresh_tokens_token_hash_idx").on(table.tokenHash),
    index("refresh_tokens_user_id_idx").on(table.userId),
  ],
);

// ─── Auth Tokens (email verification, password reset) ───
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 20 }).notNull(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_tokens_identifier_type_idx").on(table.identifier, table.type),
  ],
);

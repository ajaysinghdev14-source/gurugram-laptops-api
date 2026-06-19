import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Laptops API columns
  fullName: varchar('full_name', { length: 255 }),
  password: varchar('password', { length: 255 }),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  refreshToken: varchar('refresh_token', { length: 255 }),
  isEmailVerified: boolean('is_email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordTokenExpires: timestamp('reset_password_token_expires'),

  // Jobs API columns
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }).default(''),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
  provider: varchar('provider', { length: 20 }).notNull().default('email'),
  
  // Shared columns
  role: varchar('role', { length: 50 }).default('USER'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

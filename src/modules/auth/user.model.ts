import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),

  password: varchar('password', { length: 255 }),

  role: varchar('role', { length: 50 }).default('USER'),
  status: varchar('status', { length: 50 }).default('ACTIVE'),

  refreshToken: varchar('refresh_token', { length: 255 }),
  isEmailVerified: boolean('is_email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),

  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordTokenExpires: timestamp('reset_password_token_expires'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

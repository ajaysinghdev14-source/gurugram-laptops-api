import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  ACCESS_TOKEN_SECRET: z.string().min(10, "ACCESS_TOKEN_SECRET is too short"),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_SECRET: z.string().min(10, "REFRESH_TOKEN_SECRET is too short"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().default("SortOut <onboarding@resend.dev>"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables.");
  console.error(parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;

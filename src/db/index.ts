import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";

const connection = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(connection);

export async function testConnection(): Promise<void> {
  try {
    await connection`SELECT 1`;
    console.log(`Database connected successfully`);
  } catch (error) {
    console.error(`Database connection failed:`, error);
    process.exit(1);
  }
}

import twilio from "twilio";
import { env } from "../../config/env.js";

let client: ReturnType<typeof twilio> | null = null;

function getClient(): ReturnType<typeof twilio> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)");
  }
  if (!client) {
    client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

/**
 * Send OTP via SMS using Twilio. Requires TWILIO_* in .env.
 * Trial accounts can only send to verified numbers.
 */
export async function sendOtpSms(to: string, code: string): Promise<void> {
  const from = env.TWILIO_PHONE_NUMBER;
  if (!from) {
    throw new Error("TWILIO_PHONE_NUMBER is not set");
  }
  const twilioClient = getClient();
  await twilioClient.messages.create({
    body: `Your SortOut verification code is: ${code}`,
    from,
    to,
  });
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_PHONE_NUMBER,
  );
}

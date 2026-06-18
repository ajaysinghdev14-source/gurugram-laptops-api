import { env } from "../../config/env.js";

const TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

export interface GoogleTokenPayload {
  email: string;
  name: string;
  picture?: string;
}

/**
 * Verifies a Google ID token (from frontend Sign-In) and returns email, name, picture.
 * Uses Google's tokeninfo endpoint. Requires GOOGLE_CLIENT_ID in env.
 */
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleTokenPayload> {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error("Google sign-in is not configured");
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  const res = await fetch(
    `${TOKENINFO_URL}${encodeURIComponent(idToken)}`,
    { method: "GET" },
  );

  if (!res.ok) {
    const err = new Error("Invalid or expired Google token");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }

  const data = (await res.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string;
    name?: string;
    picture?: string;
    sub?: string;
  };

  if (data.aud !== clientId) {
    const err = new Error("Invalid Google token audience");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }

  const email = data.email?.trim();
  if (!email) {
    const err = new Error("Google token missing email");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }

  return {
    email,
    name: data.name?.trim() || email.split("@")[0] || "User",
    picture: data.picture?.trim() || undefined,
  };
}

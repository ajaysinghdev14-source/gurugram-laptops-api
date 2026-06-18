import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import * as tokenService from "../../src/modules/user-management/token.service.js";
import * as googleAuthService from "../../src/modules/user-management/googleAuth.service.js";
import * as twilioService from "../../src/modules/user-management/twilio.service.js";

vi.mock("../../src/modules/user-management/googleAuth.service.js");
vi.mock("../../src/modules/user-management/twilio.service.js");

const BASE = "/api/auth";

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@test.com`;
}

describe("POST /api/auth/register", () => {
  it("returns 201 with user and accessToken when body is valid", async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "password123", name: "Test User" })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(201);
    expect(res.body.message).toBe("Registered");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.name).toBe("Test User");
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.expiresIn).toBe("15m");
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"]?.some((c: string) => c.startsWith("refreshToken="))).toBe(true);
  });

  it("returns 400 when email is invalid", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: "not-an-email", password: "password123", name: "Test" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it("returns 400 when password is too short", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: "a@b.com", password: "short", name: "Test" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: "a@b.com", password: "password123" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });

  it("returns 409 when email already registered", async () => {
    const email = uniqueEmail();
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "password123", name: "First" })
      .expect(201);

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "otherpass123", name: "Second" })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email already registered");
  });
});

describe("POST /api/auth/login", () => {
  const loginEmail = uniqueEmail();
  const loginPassword = "loginpass123";

  beforeAll(async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: loginEmail, password: loginPassword, name: "Login User" })
      .expect(201);
  });

  it("returns 200 with user and accessToken when credentials are valid", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: loginEmail, password: loginPassword })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(loginEmail);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("returns 400 when body is invalid (missing email)", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ password: loginPassword })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });

  it("returns 401 when password is wrong", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: loginEmail, password: "wrongpassword" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("returns 401 when email is not registered", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: "never-registered@test.com", password: "anypass123" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid email or password");
  });
});

describe("GET /api/auth/me", () => {
  const meEmail = uniqueEmail();
  const mePassword = "mepass123";
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: meEmail, password: mePassword, name: "Me User" })
      .expect(201);
    accessToken = res.body.data.accessToken;
  });

  it("returns 200 with user when Authorization Bearer is valid", async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(meEmail);
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get(`${BASE}/me`).expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("returns 401 when token is invalid", async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set("Authorization", "Bearer invalid-token-here")
      .expect(401);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/refresh", () => {
  it("returns 200 with new accessToken when refresh cookie is valid", async () => {
    const email = uniqueEmail();
    const agent = request.agent(app);
    await agent
      .post(`${BASE}/register`)
      .send({ email, password: "refreshpass123", name: "Refresh User" })
      .expect(201);

    const res = await agent.post(`${BASE}/refresh`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("returns 401 when no refresh token is sent", async () => {
    const res = await request(app).post(`${BASE}/refresh`).expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Refresh token required");
  });

  it("returns 401 when refresh token is invalid", async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .set("Cookie", "refreshToken=invalid-refresh-token")
      .expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid or expired refresh token");
  });
});

describe("POST /api/auth/logout", () => {
  it("returns 200 and clears cookie when called with refresh cookie", async () => {
    const email = uniqueEmail();
    const agent = request.agent(app);
    await agent
      .post(`${BASE}/register`)
      .send({ email, password: "logoutpass123", name: "Logout User" })
      .expect(201);

    const res = await agent.post(`${BASE}/logout`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged out");
    expect(res.body.data).toBeNull();
  });

  it("returns 200 when called without cookie (idempotent)", async () => {
    const res = await request(app).post(`${BASE}/logout`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged out");
  });
});

describe("POST /api/auth/verify-email", () => {
  it("returns 200 when token is valid and marks email verified", async () => {
    const email = uniqueEmail();
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "verifypass123", name: "Verify User" })
      .expect(201);
    const token = await tokenService.createEmailVerifyToken(email);
    const res = await request(app)
      .post(`${BASE}/verify-email`)
      .send({ token })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Email verified");
    expect(res.body.data).toBeNull();
  });

  it("returns 400 when token is invalid", async () => {
    const res = await request(app)
      .post(`${BASE}/verify-email`)
      .send({ token: "invalid-token-here" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid or expired");
  });

  it("returns 400 when token is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/verify-email`)
      .send({})
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });
});

describe("POST /api/auth/resend-verify-email", () => {
  it("returns 200 when user exists and is not verified", async () => {
    const email = uniqueEmail();
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "resendpass123", name: "Resend User" })
      .expect(201);
    const res = await request(app)
      .post(`${BASE}/resend-verify-email`)
      .send({ email })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("verification link");
  });

  it("returns 200 when email is not registered (no enumeration)", async () => {
    const res = await request(app)
      .post(`${BASE}/resend-verify-email`)
      .send({ email: "not-registered@test.com" })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("verification link");
  });

  it("returns 200 and 'already verified' when user is already verified", async () => {
    const email = uniqueEmail();
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "alrverified123", name: "Already Verified" })
      .expect(201);
    const token = await tokenService.createEmailVerifyToken(email);
    await request(app).post(`${BASE}/verify-email`).send({ token }).expect(200);
    const res = await request(app)
      .post(`${BASE}/resend-verify-email`)
      .send({ email })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Email is already verified.");
  });

  it("returns 400 when email is invalid", async () => {
    const res = await request(app)
      .post(`${BASE}/resend-verify-email`)
      .send({ email: "not-an-email" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("returns 200 when user exists (no enumeration)", async () => {
    const email = uniqueEmail();
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "forgotpass123", name: "Forgot User" })
      .expect(201);
    const res = await request(app)
      .post(`${BASE}/forgot-password`)
      .send({ email })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("password reset link");
  });

  it("returns 200 when email is not registered (no enumeration)", async () => {
    const res = await request(app)
      .post(`${BASE}/forgot-password`)
      .send({ email: "no-account@test.com" })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("password reset link");
  });

  it("returns 400 when email is invalid", async () => {
    const res = await request(app)
      .post(`${BASE}/forgot-password`)
      .send({ email: "bad-email" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });
});

describe("POST /api/auth/reset-password", () => {
  it("returns 200 when token is valid and password is updated", async () => {
    const email = uniqueEmail();
    const oldPassword = "oldpass123";
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: oldPassword, name: "Reset User" })
      .expect(201);
    const token = await tokenService.createPasswordResetToken(email);
    const newPassword = "newpass123";
    const res = await request(app)
      .post(`${BASE}/reset-password`)
      .send({ token, newPassword })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Password has been reset");
    await request(app)
      .post(`${BASE}/login`)
      .send({ email, password: newPassword })
      .expect(200);
    await request(app)
      .post(`${BASE}/login`)
      .send({ email, password: oldPassword })
      .expect(401);
  });

  it("returns 400 when token is invalid or expired", async () => {
    const res = await request(app)
      .post(`${BASE}/reset-password`)
      .send({ token: "invalid-token", newPassword: "newpass123" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid or expired");
  });

  it("returns 400 when newPassword is too short", async () => {
    const email = uniqueEmail();
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "validpass123", name: "Short Pass User" })
      .expect(201);
    const token = await tokenService.createPasswordResetToken(email);
    const res = await request(app)
      .post(`${BASE}/reset-password`)
      .send({ token, newPassword: "short" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });
});

describe("POST /api/auth/google", () => {
  it("returns 200 with user and accessToken when idToken is valid", async () => {
    const email = uniqueEmail();
    vi.mocked(googleAuthService.verifyGoogleIdToken).mockResolvedValueOnce({
      email,
      name: "Google User",
      picture: "https://example.com/photo.jpg",
    });

    const res = await request(app)
      .post(`${BASE}/google`)
      .send({ idToken: "valid-google-id-token" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged in");
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.name).toBe("Google User");
    expect(res.body.data.user.avatarUrl).toBe("https://example.com/photo.jpg");
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.expiresIn).toBe("15m");
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(
      res.headers["set-cookie"]?.some((c: string) => c.startsWith("refreshToken=")),
    ).toBe(true);
  });

  it("returns 401 when idToken is invalid", async () => {
    const err = new Error("Invalid or expired Google token") as Error & {
      statusCode?: number;
    };
    err.statusCode = 401;
    vi.mocked(googleAuthService.verifyGoogleIdToken).mockRejectedValueOnce(err);

    const res = await request(app)
      .post(`${BASE}/google`)
      .send({ idToken: "invalid-token" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid");
  });

  it("returns 400 when idToken is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/google`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });
});

describe("POST /api/auth/request-otp", () => {
  it("returns 503 when Twilio is not configured", async () => {
    vi.mocked(twilioService.isTwilioConfigured).mockReturnValue(false);

    const res = await request(app)
      .post(`${BASE}/request-otp`)
      .send({ phone: "+17656456966" })
      .expect(503);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("not configured");
  });

  it("returns 200 and sends OTP when Twilio is configured", async () => {
    vi.mocked(twilioService.isTwilioConfigured).mockReturnValue(true);
    vi.mocked(twilioService.sendOtpSms).mockResolvedValue(undefined);
    const uniquePhone = `+1555${Date.now().toString().slice(-7)}`;

    const res = await request(app)
      .post(`${BASE}/request-otp`)
      .send({ phone: uniquePhone })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("OTP was sent");
    expect(twilioService.sendOtpSms).toHaveBeenCalledWith(
      uniquePhone,
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it("returns 400 when phone is missing or invalid", async () => {
    vi.mocked(twilioService.isTwilioConfigured).mockReturnValue(true);

    const res = await request(app)
      .post(`${BASE}/request-otp`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });
});

describe("POST /api/auth/verify-otp", () => {
  it("returns 200 with user (email=null) and tokens when code is valid", async () => {
    const phone = `+1555${Date.now().toString().slice(-7)}`;
    const code = await tokenService.createPhoneOtpToken(phone);

    const res = await request(app)
      .post(`${BASE}/verify-otp`)
      .send({ phone, code })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged in");
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBeNull();
    expect(res.body.data.user.phone).toBe(phone);
    expect(res.body.data.user.phoneVerifiedAt).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.expiresIn).toBe("15m");
    expect(
      res.headers["set-cookie"]?.some((c: string) => c.startsWith("refreshToken=")),
    ).toBe(true);
  });

  it("returns 400 when code is invalid or expired", async () => {
    const res = await request(app)
      .post(`${BASE}/verify-otp`)
      .send({ phone: "+17656456966", code: "000000" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid or expired");
  });

  it("returns 400 when code is missing or wrong length", async () => {
    const res = await request(app)
      .post(`${BASE}/verify-otp`)
      .send({ phone: "+17656456966", code: "123" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });
});

describe("POST /api/auth/link-phone", () => {
  it("links phone to an email-based user, then phone login returns same user ID", async () => {
    const email = uniqueEmail();
    const regRes = await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "password123", name: "Link Phone User" })
      .expect(201);

    const accessToken = regRes.body.data.accessToken;
    const userId = regRes.body.data.user.id;
    const phone = `+1555${Date.now().toString().slice(-7)}`;

    const code = await tokenService.createPhoneOtpToken(phone);
    const linkRes = await request(app)
      .post(`${BASE}/link-phone`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ phone, code })
      .expect(200);

    expect(linkRes.body.success).toBe(true);
    expect(linkRes.body.message).toContain("Phone linked");
    expect(linkRes.body.data.user.phone).toBe(phone);
    expect(linkRes.body.data.user.phoneVerifiedAt).toBeDefined();
    expect(linkRes.body.data.user.id).toBe(userId);

    const otpCode = await tokenService.createPhoneOtpToken(phone);
    const otpRes = await request(app)
      .post(`${BASE}/verify-otp`)
      .send({ phone, code: otpCode })
      .expect(200);

    expect(otpRes.body.data.user.id).toBe(userId);
  });

  it("returns 409 when phone already belongs to another user", async () => {
    const phone = `+1555${Date.now().toString().slice(-7)}`;
    const otpCode = await tokenService.createPhoneOtpToken(phone);
    await request(app)
      .post(`${BASE}/verify-otp`)
      .send({ phone, code: otpCode })
      .expect(200);

    const email = uniqueEmail();
    const regRes = await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: "password123", name: "Conflict User" })
      .expect(201);
    const accessToken = regRes.body.data.accessToken;

    const code = await tokenService.createPhoneOtpToken(phone);
    const res = await request(app)
      .post(`${BASE}/link-phone`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ phone, code })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("already linked");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post(`${BASE}/link-phone`)
      .send({ phone: "+15551234567", code: "123456" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/link-email", () => {
  it("links email to a phone-based user, then email login returns same user ID", async () => {
    const phone = `+1555${Date.now().toString().slice(-7)}`;
    const otpCode = await tokenService.createPhoneOtpToken(phone);
    const otpRes = await request(app)
      .post(`${BASE}/verify-otp`)
      .send({ phone, code: otpCode })
      .expect(200);

    const accessToken = otpRes.body.data.accessToken;
    const userId = otpRes.body.data.user.id;
    const email = uniqueEmail();
    const password = "linkpass123";

    const linkRes = await request(app)
      .post(`${BASE}/link-email`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email, password, name: "Linked Name" })
      .expect(200);

    expect(linkRes.body.success).toBe(true);
    expect(linkRes.body.message).toContain("Email linked");
    expect(linkRes.body.data.user.email).toBe(email);
    expect(linkRes.body.data.user.id).toBe(userId);

    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email, password })
      .expect(200);

    expect(loginRes.body.data.user.id).toBe(userId);
  });

  it("returns 409 when email already belongs to another user", async () => {
    const existingEmail = uniqueEmail();
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: existingEmail, password: "password123", name: "Existing" })
      .expect(201);

    const phone = `+1555${Date.now().toString().slice(-7)}`;
    const otpCode = await tokenService.createPhoneOtpToken(phone);
    const otpRes = await request(app)
      .post(`${BASE}/verify-otp`)
      .send({ phone, code: otpCode })
      .expect(200);
    const accessToken = otpRes.body.data.accessToken;

    const res = await request(app)
      .post(`${BASE}/link-email`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: existingEmail, password: "password123" })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("already linked");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post(`${BASE}/link-email`)
      .send({ email: "test@test.com", password: "password123" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

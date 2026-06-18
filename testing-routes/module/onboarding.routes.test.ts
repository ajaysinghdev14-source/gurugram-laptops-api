import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const BASE_AUTH = "/api/auth";
const BASE_OB = "/api/onboarding";
const BASE_MASTER = "/api/master";

let accessToken: string;
let userId: string;
let cityId: number;
let localityId: number;
let roleId: number;
let skillIds: number[];

function uniqueEmail() {
  return `ob-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

beforeAll(async () => {
  // Register a fresh user
  const email = uniqueEmail();
  const res = await request(app)
    .post(`${BASE_AUTH}/register`)
    .send({ email, password: "password123", name: "Onboarding Tester" })
    .expect(201);

  accessToken = res.body.data.accessToken;
  userId = res.body.data.user.id;

  // Fetch master data for the tests
  const citiesRes = await request(app).get(`${BASE_MASTER}/cities`);
  cityId = citiesRes.body.data[0].id;

  const localitiesRes = await request(app).get(
    `${BASE_MASTER}/cities/${cityId}/localities`,
  );
  localityId = localitiesRes.body.data[0].id;

  const rolesRes = await request(app).get(`${BASE_MASTER}/roles`);
  roleId = rolesRes.body.data[0].id;

  const skillsRes = await request(app).get(
    `${BASE_MASTER}/roles/${roleId}/skills`,
  );
  skillIds = skillsRes.body.data.slice(0, 3).map((s: any) => s.id);
});

describe("GET /api/onboarding/status/:userId", () => {
  it("returns 200 with hasProfile=false for fresh user", async () => {
    const res = await request(app)
      .get(`${BASE_OB}/status/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.hasProfile).toBe(false);
    expect(res.body.data.profileCompleted).toBe(false);
  });

  it("returns 401 without auth", async () => {
    await request(app)
      .get(`${BASE_OB}/status/${userId}`)
      .expect(401);
  });

  it("returns 403 for different userId", async () => {
    await request(app)
      .get(`${BASE_OB}/status/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);
  });
});

describe("POST /api/onboarding/profile/:userId", () => {
  it("returns 201 and creates profile", async () => {
    const res = await request(app)
      .post(`${BASE_OB}/profile/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        fullName: "Onboarding Tester",
        gender: "MALE",
        educationLevel: "GRADUATE",
        hasExperience: true,
        experienceLevel: "YEARS_2",
        currentSalary: 600000,
        preferredCityId: cityId,
        preferredLocalityId: localityId,
        whatsappUpdates: true,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe("Onboarding Tester");
    expect(res.body.data.gender).toBe("MALE");
    expect(res.body.data.preferredCityId).toBe(cityId);
  });

  it("returns 400 with invalid data", async () => {
    await request(app)
      .post(`${BASE_OB}/profile/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullName: "" })
      .expect(400);
  });
});

describe("POST /api/onboarding/preferences/:userId", () => {
  it("returns 200 and saves preferences", async () => {
    const res = await request(app)
      .post(`${BASE_OB}/preferences/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ preferredRoleId: roleId, skillIds })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.preferredRoleId).toBe(roleId);
    expect(res.body.data.profileCompleted).toBe(true);
  });

  it("status shows completed after preferences", async () => {
    const res = await request(app)
      .get(`${BASE_OB}/status/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.hasProfile).toBe(true);
    expect(res.body.data.profileCompleted).toBe(true);
    expect(res.body.data.hasPreferences).toBe(true);
  });
});

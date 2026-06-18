import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const BASE_AUTH = "/api/auth";
const BASE_MASTER = "/api/master";
const BASE_OB = "/api/onboarding";
const BASE_JOBS = "/api/jobs";

let accessToken: string;
let userId: string;
let firstJobId: number;

function uniqueEmail() {
  return `jobs-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

beforeAll(async () => {
  // Register + onboard so user has a profile for recommendations
  const email = uniqueEmail();
  const regRes = await request(app)
    .post(`${BASE_AUTH}/register`)
    .send({ email, password: "password123", name: "Jobs Tester" })
    .expect(201);

  accessToken = regRes.body.data.accessToken;
  userId = regRes.body.data.user.id;

  const citiesRes = await request(app).get(`${BASE_MASTER}/cities`);
  const cityId = citiesRes.body.data[0].id;

  const rolesRes = await request(app).get(`${BASE_MASTER}/roles`);
  const roleId = rolesRes.body.data[0].id;
  const skillsRes = await request(app).get(
    `${BASE_MASTER}/roles/${roleId}/skills`,
  );
  const skillIds = skillsRes.body.data.slice(0, 3).map((s: any) => s.id);

  await request(app)
    .post(`${BASE_OB}/profile/${userId}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      fullName: "Jobs Tester",
      gender: "MALE",
      educationLevel: "GRADUATE",
      hasExperience: true,
      experienceLevel: "YEARS_2",
      currentSalary: 600000,
      preferredCityId: cityId,
    })
    .expect(201);

  await request(app)
    .post(`${BASE_OB}/preferences/${userId}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ preferredRoleId: roleId, skillIds })
    .expect(200);
});

describe("GET /api/jobs (public listing)", () => {
  it("returns 200 with paginated jobs", async () => {
    const res = await request(app).get(`${BASE_JOBS}?page=1&size=5`).expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.jobs)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.jobs.length).toBeGreaterThan(0);
    firstJobId = res.body.data.jobs[0].id;
  });
});

describe("POST /api/jobs/search", () => {
  it("returns 200 with search results", async () => {
    const res = await request(app)
      .post(`${BASE_JOBS}/search`)
      .send({ keyword: "Developer" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.jobs.length).toBeGreaterThan(0);
  });

  it("returns 200 with filtered results by locationType", async () => {
    const res = await request(app)
      .post(`${BASE_JOBS}/search`)
      .send({ locationType: "REMOTE" })
      .expect(200);

    expect(res.body.success).toBe(true);
    for (const job of res.body.data.jobs) {
      expect(job.locationType).toBe("REMOTE");
    }
  });
});

describe("GET /api/jobs/:jobId (job detail)", () => {
  it("returns 200 with job detail", async () => {
    const res = await request(app)
      .get(`${BASE_JOBS}/${firstJobId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(firstJobId);
    expect(res.body.data.title).toBeDefined();
    expect(res.body.data.skills).toBeDefined();
  });

  it("returns 200 with isSaved/isApplied when userId passed", async () => {
    const res = await request(app)
      .get(`${BASE_JOBS}/${firstJobId}?userId=${userId}`)
      .expect(200);

    expect(res.body.data.isSaved).toBeDefined();
    expect(res.body.data.isApplied).toBeDefined();
  });
});

describe("GET /api/jobs/recommended/:userId", () => {
  it("returns 200 with recommended jobs", async () => {
    const res = await request(app)
      .get(`${BASE_JOBS}/recommended/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.jobs)).toBe(true);
  });
});

describe("Save/Unsave Jobs", () => {
  it("POST saves a job", async () => {
    const res = await request(app)
      .post(`${BASE_JOBS}/${firstJobId}/save/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it("GET /saved/:userId returns saved jobs", async () => {
    const res = await request(app)
      .get(`${BASE_JOBS}/saved/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.jobs.length).toBeGreaterThan(0);
  });

  it("GET /saved/:userId/ids returns saved job IDs", async () => {
    const res = await request(app)
      .get(`${BASE_JOBS}/saved/${userId}/ids`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).toContain(firstJobId);
  });

  it("DELETE unsaves a job", async () => {
    await request(app)
      .delete(`${BASE_JOBS}/${firstJobId}/save/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });
});

describe("Applications", () => {
  it("POST applies to a job", async () => {
    const res = await request(app)
      .post(`${BASE_JOBS}/${firstJobId}/apply/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ coverLetter: "I am very interested in this role." })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBe(firstJobId);
    expect(res.body.data.status).toBe("PENDING");
  });

  it("POST applying again returns 409", async () => {
    await request(app)
      .post(`${BASE_JOBS}/${firstJobId}/apply/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})
      .expect(409);
  });

  it("GET /applications/:userId returns applications", async () => {
    const res = await request(app)
      .get(`${BASE_JOBS}/applications/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].application).toBeDefined();
    expect(res.body.data[0].job).toBeDefined();
  });

  it("GET /applied/:userId/ids returns applied job IDs", async () => {
    const res = await request(app)
      .get(`${BASE_JOBS}/applied/${userId}/ids`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).toContain(firstJobId);
  });
});

describe("GET /api/jobs/stats/:userId (dashboard)", () => {
  it("returns 200 with stats", async () => {
    const res = await request(app)
      .get(`${BASE_JOBS}/stats/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.applicationsSent).toBeGreaterThan(0);
    expect(typeof res.body.data.newJobsToday).toBe("number");
    expect(typeof res.body.data.savedJobs).toBe("number");
    expect(typeof res.body.data.interviewCalls).toBe("number");
  });
});

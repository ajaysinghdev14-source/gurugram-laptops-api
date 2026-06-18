import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const BASE_AUTH = "/api/auth";
const BASE_MASTER = "/api/master";
const BASE_OB = "/api/onboarding";
const BASE_PROFILE = "/api/profile";

let accessToken: string;
let userId: string;

function uniqueEmail() {
  return `prof-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

beforeAll(async () => {
  // Register, then onboard so profile exists
  const email = uniqueEmail();
  const regRes = await request(app)
    .post(`${BASE_AUTH}/register`)
    .send({ email, password: "password123", name: "Profile Tester" })
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
      fullName: "Profile Tester",
      gender: "FEMALE",
      educationLevel: "POST_GRADUATE",
      hasExperience: true,
      experienceLevel: "YEARS_3",
      currentSalary: 800000,
      preferredCityId: cityId,
    })
    .expect(201);

  await request(app)
    .post(`${BASE_OB}/preferences/${userId}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ preferredRoleId: roleId, skillIds })
    .expect(200);
});

describe("GET /api/profile/:userId", () => {
  it("returns 200 with full profile", async () => {
    const res = await request(app)
      .get(`${BASE_PROFILE}/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe("Profile Tester");
    expect(res.body.data.skills).toBeDefined();
    expect(Array.isArray(res.body.data.skills)).toBe(true);
    expect(res.body.data.employments).toBeDefined();
    expect(res.body.data.educations).toBeDefined();
  });

  it("returns 401 without auth", async () => {
    await request(app).get(`${BASE_PROFILE}/${userId}`).expect(401);
  });
});

describe("PUT /api/profile/:userId", () => {
  it("updates basic profile fields", async () => {
    const res = await request(app)
      .put(`${BASE_PROFILE}/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullName: "Updated Name", noticePeriod: "1 month" })
      .expect(200);

    expect(res.body.data.fullName).toBe("Updated Name");
    expect(res.body.data.noticePeriod).toBe("1 month");
  });
});

describe("PUT /api/profile/:userId/headline", () => {
  it("updates headline", async () => {
    const res = await request(app)
      .put(`${BASE_PROFILE}/${userId}/headline`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ headline: "Experienced Full Stack Developer" })
      .expect(200);

    expect(res.body.data.headline).toBe("Experienced Full Stack Developer");
  });
});

describe("PUT /api/profile/:userId/summary", () => {
  it("updates summary", async () => {
    const res = await request(app)
      .put(`${BASE_PROFILE}/${userId}/summary`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ summary: "I have 3+ years of experience..." })
      .expect(200);

    expect(res.body.data.summary).toBe("I have 3+ years of experience...");
  });
});

describe("Personal Details", () => {
  it("PUT creates personal details", async () => {
    const res = await request(app)
      .put(`${BASE_PROFILE}/${userId}/personal-details`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        dateOfBirth: "1995-06-15",
        maritalStatus: "SINGLE",
        address: "123 Test Street",
        pincode: "560001",
        nationality: "Indian",
      })
      .expect(200);

    expect(res.body.data.maritalStatus).toBe("SINGLE");
    expect(res.body.data.pincode).toBe("560001");
  });

  it("GET returns personal details", async () => {
    const res = await request(app)
      .get(`${BASE_PROFILE}/${userId}/personal-details`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.nationality).toBe("Indian");
  });
});

describe("Employment CRUD", () => {
  let employmentId: number;

  it("POST creates employment", async () => {
    const res = await request(app)
      .post(`${BASE_PROFILE}/${userId}/employments`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        designation: "Senior Developer",
        company: "Test Corp",
        employmentType: "FULL_TIME",
        isCurrent: true,
        startDate: "2022-01-01",
        description: "Building cool stuff",
      })
      .expect(201);

    expect(res.body.data.designation).toBe("Senior Developer");
    employmentId = res.body.data.id;
  });

  it("GET returns employments", async () => {
    const res = await request(app)
      .get(`${BASE_PROFILE}/${userId}/employments`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("PUT updates employment", async () => {
    const res = await request(app)
      .put(`${BASE_PROFILE}/${userId}/employments/${employmentId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        designation: "Lead Developer",
        company: "Test Corp",
        employmentType: "FULL_TIME",
        isCurrent: true,
        startDate: "2022-01-01",
      })
      .expect(200);

    expect(res.body.data.designation).toBe("Lead Developer");
  });

  it("DELETE removes employment", async () => {
    await request(app)
      .delete(`${BASE_PROFILE}/${userId}/employments/${employmentId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });
});

describe("Education CRUD", () => {
  let educationId: number;

  it("POST creates education", async () => {
    const res = await request(app)
      .post(`${BASE_PROFILE}/${userId}/educations`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        degree: "B.Tech",
        specialization: "Computer Science",
        institution: "IIT Delhi",
        passOutYear: 2020,
        gradeType: "CGPA",
        grade: "8.5",
      })
      .expect(201);

    expect(res.body.data.degree).toBe("B.Tech");
    educationId = res.body.data.id;
  });

  it("GET returns educations", async () => {
    const res = await request(app)
      .get(`${BASE_PROFILE}/${userId}/educations`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("PUT updates education", async () => {
    const res = await request(app)
      .put(`${BASE_PROFILE}/${userId}/educations/${educationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        degree: "M.Tech",
        specialization: "Computer Science",
        institution: "IIT Delhi",
        passOutYear: 2022,
      })
      .expect(200);

    expect(res.body.data.degree).toBe("M.Tech");
  });

  it("DELETE removes education", async () => {
    await request(app)
      .delete(`${BASE_PROFILE}/${userId}/educations/${educationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });
});

describe("Projects CRUD", () => {
  let projectId: number;

  it("POST creates project", async () => {
    const res = await request(app)
      .post(`${BASE_PROFILE}/${userId}/projects`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Job Portal",
        description: "A Naukri-like platform",
        startDate: "2024-01-01",
        isOngoing: true,
        projectUrl: "https://github.com/test/job-portal",
      })
      .expect(201);

    expect(res.body.data.title).toBe("Job Portal");
    projectId = res.body.data.id;
  });

  it("GET returns projects", async () => {
    const res = await request(app)
      .get(`${BASE_PROFILE}/${userId}/projects`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("PUT updates project", async () => {
    const res = await request(app)
      .put(`${BASE_PROFILE}/${userId}/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "SortOut Jobs",
        description: "An awesome job portal",
        isOngoing: false,
        endDate: "2025-12-31",
      })
      .expect(200);

    expect(res.body.data.title).toBe("SortOut Jobs");
  });

  it("DELETE removes project", async () => {
    await request(app)
      .delete(`${BASE_PROFILE}/${userId}/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });
});

describe("IT Skills CRUD", () => {
  let itSkillId: number;

  it("POST creates IT skill", async () => {
    const res = await request(app)
      .post(`${BASE_PROFILE}/${userId}/it-skills`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "React.js",
        proficiency: "EXPERT",
        experienceMonths: 36,
      })
      .expect(201);

    expect(res.body.data.name).toBe("React.js");
    itSkillId = res.body.data.id;
  });

  it("GET returns IT skills", async () => {
    const res = await request(app)
      .get(`${BASE_PROFILE}/${userId}/it-skills`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("PUT updates IT skill", async () => {
    const res = await request(app)
      .put(`${BASE_PROFILE}/${userId}/it-skills/${itSkillId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "React.js",
        proficiency: "EXPERT",
        experienceMonths: 42,
      })
      .expect(200);

    expect(res.body.data.experienceMonths).toBe(42);
  });

  it("DELETE removes IT skill", async () => {
    await request(app)
      .delete(`${BASE_PROFILE}/${userId}/it-skills/${itSkillId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });
});

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const BASE = "/api/master";

describe("GET /api/master/cities", () => {
  it("returns 200 with array of cities", async () => {
    const res = await request(app).get(`${BASE}/cities`).expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("id");
    expect(res.body.data[0]).toHaveProperty("name");
    expect(res.body.data[0]).toHaveProperty("state");
  });
});

describe("GET /api/master/cities/:cityId/localities", () => {
  it("returns 200 with array of localities for a valid city", async () => {
    const citiesRes = await request(app).get(`${BASE}/cities`).expect(200);
    const cityId = citiesRes.body.data[0].id;

    const res = await request(app)
      .get(`${BASE}/cities/${cityId}/localities`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("cityId", cityId);
  });

  it("returns 200 with empty array for non-existent city", async () => {
    const res = await request(app)
      .get(`${BASE}/cities/99999/localities`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});

describe("GET /api/master/roles", () => {
  it("returns 200 with array of job roles", async () => {
    const res = await request(app).get(`${BASE}/roles`).expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("id");
    expect(res.body.data[0]).toHaveProperty("name");
    expect(res.body.data[0]).toHaveProperty("category");
  });
});

describe("GET /api/master/roles/:roleId/skills", () => {
  it("returns 200 with skills for a valid role", async () => {
    const rolesRes = await request(app).get(`${BASE}/roles`).expect(200);
    const roleId = rolesRes.body.data[0].id;

    const res = await request(app)
      .get(`${BASE}/roles/${roleId}/skills`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("roleId", roleId);
    expect(res.body.data[0]).toHaveProperty("name");
  });

  it("returns empty array for non-existent role", async () => {
    const res = await request(app)
      .get(`${BASE}/roles/99999/skills`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});

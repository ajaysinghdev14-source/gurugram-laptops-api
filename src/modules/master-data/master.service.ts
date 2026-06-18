import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { cities, localities, jobRoles, skills } from "../../db/schema/index.js";

export async function getAllCities() {
  return db.select().from(cities).orderBy(cities.name);
}

export async function getLocalitiesByCityId(cityId: number) {
  return db
    .select()
    .from(localities)
    .where(eq(localities.cityId, cityId))
    .orderBy(localities.name);
}

export async function getAllRoles() {
  return db.select().from(jobRoles).orderBy(jobRoles.name);
}

export async function getSkillsByRoleId(roleId: number) {
  return db
    .select()
    .from(skills)
    .where(eq(skills.roleId, roleId))
    .orderBy(skills.name);
}

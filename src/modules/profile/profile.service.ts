import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  users,
  profiles,
  profileSkills,
  personalDetails,
  employments,
  educations,
  projects,
  itSkills,
  resumes,
  skills,
  cities,
  localities,
  jobRoles,
} from "../../db/schema/index.js";
import { ApiError } from "../../utils/apiError.js";
import * as tokenService from "../user-management/token.service.js";
import * as emailService from "../user-management/email.service.js";
import type {
  UpdateBasicProfile,
  PersonalDetailsInput,
  EmploymentInput,
  EducationInput,
  ProjectInput,
  ItSkillInput,
} from "./profile.types.js";

// ─── Helpers ─────────────────────────────────────────────────

async function getProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

function requireProfile(profile: Awaited<ReturnType<typeof getProfileByUserId>>) {
  if (!profile) {
    throw new ApiError(404, "Profile not found. Complete onboarding first.");
  }
  return profile;
}

// ─── Full Profile Read ───────────────────────────────────────

export async function getFullProfile(userId: string) {
  const profile = requireProfile(await getProfileByUserId(userId));

  const [personal] = await db
    .select()
    .from(personalDetails)
    .where(eq(personalDetails.profileId, profile.id))
    .limit(1);

  const empList = await db
    .select()
    .from(employments)
    .where(eq(employments.profileId, profile.id))
    .orderBy(employments.isCurrent, employments.startDate);

  const eduList = await db
    .select()
    .from(educations)
    .where(eq(educations.profileId, profile.id))
    .orderBy(educations.passOutYear);

  const projList = await db
    .select()
    .from(projects)
    .where(eq(projects.profileId, profile.id))
    .orderBy(projects.startDate);

  const itSkillsList = await db
    .select()
    .from(itSkills)
    .where(eq(itSkills.profileId, profile.id))
    .orderBy(itSkills.name);

  const [resume] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.profileId, profile.id))
    .limit(1);

  const profileSkillRows = await db
    .select({
      skillId: profileSkills.skillId,
      skillName: skills.name,
    })
    .from(profileSkills)
    .innerJoin(skills, eq(profileSkills.skillId, skills.id))
    .where(eq(profileSkills.profileId, profile.id));

  // Resolve city / locality / role names
  let cityName = null;
  let localityName = null;
  let roleName = null;

  if (profile.preferredCityId) {
    const [city] = await db
      .select({ name: cities.name })
      .from(cities)
      .where(eq(cities.id, profile.preferredCityId))
      .limit(1);
    cityName = city?.name ?? null;
  }
  if (profile.preferredLocalityId) {
    const [loc] = await db
      .select({ name: localities.name })
      .from(localities)
      .where(eq(localities.id, profile.preferredLocalityId))
      .limit(1);
    localityName = loc?.name ?? null;
  }
  if (profile.preferredRoleId) {
    const [role] = await db
      .select({ name: jobRoles.name })
      .from(jobRoles)
      .where(eq(jobRoles.id, profile.preferredRoleId))
      .limit(1);
    roleName = role?.name ?? null;
  }

  // User contact info (phone, email) for profile display
  const [userRow] = await db
    .select({
      phone: users.phone,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, profile.userId))
    .limit(1);

  // Notice period for header: use current employment's if set, else profile's
  const currentEmployment = empList.find((e) => e.isCurrent);
  const displayNoticePeriod =
    currentEmployment?.noticePeriod?.trim() ||
    profile.noticePeriod?.trim() ||
    null;

  return {
    ...profile,
    userId: profile.userId,
    resumeHeadline: profile.headline,
    noticePeriod: displayNoticePeriod,
    cityName,
    localityName,
    roleName,
    phone: userRow?.phone ?? null,
    email: userRow?.email ?? null,
    emailVerified: !!userRow?.emailVerifiedAt,
    skills: profileSkillRows,
    personalDetails: personal ?? null,
    employments: empList,
    educations: eduList,
    projects: projList,
    itSkills: itSkillsList,
    resume: resume ?? null,
  };
}

// ─── Basic Profile Update ────────────────────────────────────

export async function updateBasicProfile(
  userId: string,
  data: UpdateBasicProfile,
) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const {
    cityId,
    localityId,
    headline: headlineVal,
    ...rest
  } = data as UpdateBasicProfile & {
    cityId?: number;
    localityId?: number | null;
    headline?: string | null;
  };
  const updatePayload: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (cityId !== undefined) updatePayload.preferredCityId = cityId;
  if (localityId !== undefined) updatePayload.preferredLocalityId = localityId;
  if (headlineVal !== undefined) updatePayload.headline = headlineVal;
  const [updated] = await db
    .update(profiles)
    .set(updatePayload as typeof profiles.$inferInsert)
    .where(eq(profiles.id, profile.id))
    .returning();
  return updated;
}

// ─── Email change (OTP) ───────────────────────────────────────

export async function initiateEmailChange(
  userId: string,
  newEmail: string,
): Promise<{ expiresInSeconds: number }> {
  const email = newEmail.toLowerCase().trim();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    throw new ApiError(409, "This email is already registered");
  }
  const { code, expiresInSeconds } =
    await tokenService.createEmailChangeOtpToken(userId, email);
  const sent = await emailService.sendEmailChangeOtp(email, code);
  if (!sent.ok) {
    throw new ApiError(500, sent.error ?? "Failed to send OTP email");
  }
  return { expiresInSeconds };
}

export async function verifyEmailChange(
  userId: string,
  newEmail: string,
  code: string,
): Promise<{ newEmail: string }> {
  const result = await tokenService.consumeEmailChangeOtpToken(
    userId,
    newEmail,
    code,
  );
  if (!result) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  await db
    .update(users)
    .set({
      email: result.newEmail,
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  return { newEmail: result.newEmail };
}

// ─── Headline + Summary ──────────────────────────────────────

export async function updateHeadline(userId: string, headline: string) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const [updated] = await db
    .update(profiles)
    .set({ headline, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id))
    .returning();
  return updated;
}

export async function updateSummary(userId: string, summary: string) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const [updated] = await db
    .update(profiles)
    .set({ summary, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id))
    .returning();
  return updated;
}

// ─── Personal Details ────────────────────────────────────────

export async function getPersonalDetails(userId: string) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const [details] = await db
    .select()
    .from(personalDetails)
    .where(eq(personalDetails.profileId, profile.id))
    .limit(1);
  return details ?? null;
}

export async function upsertPersonalDetails(
  userId: string,
  data: PersonalDetailsInput,
) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const existing = await db
    .select({ id: personalDetails.id })
    .from(personalDetails)
    .where(eq(personalDetails.profileId, profile.id))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(personalDetails)
      .set(data)
      .where(eq(personalDetails.profileId, profile.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(personalDetails)
    .values({ profileId: profile.id, ...data })
    .returning();
  return created;
}

// ─── Employment CRUD ─────────────────────────────────────────

export async function getEmployments(userId: string) {
  const profile = requireProfile(await getProfileByUserId(userId));
  return db
    .select()
    .from(employments)
    .where(eq(employments.profileId, profile.id))
    .orderBy(employments.startDate);
}

function normalizeEmploymentDates(data: EmploymentInput) {
  return {
    ...data,
    startDate: data.startDate?.trim() ? data.startDate : null,
    endDate: data.endDate?.trim() ? data.endDate : null,
  };
}

export async function createEmployment(userId: string, data: EmploymentInput) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const payload = normalizeEmploymentDates(data);
  const [created] = await db
    .insert(employments)
    .values({ profileId: profile.id, ...payload })
    .returning();
  return created;
}

export async function updateEmployment(
  userId: string,
  employmentId: number,
  data: EmploymentInput,
) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const payload = normalizeEmploymentDates(data);
  const [updated] = await db
    .update(employments)
    .set({ ...payload, updatedAt: new Date() })
    .where(
      and(
        eq(employments.id, employmentId),
        eq(employments.profileId, profile.id),
      ),
    )
    .returning();
  if (!updated) throw new ApiError(404, "Employment not found");
  return updated;
}

export async function deleteEmployment(userId: string, employmentId: number) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const deleted = await db
    .delete(employments)
    .where(
      and(
        eq(employments.id, employmentId),
        eq(employments.profileId, profile.id),
      ),
    )
    .returning();
  if (deleted.length === 0) throw new ApiError(404, "Employment not found");
}

// ─── Education CRUD ──────────────────────────────────────────

export async function getEducations(userId: string) {
  const profile = requireProfile(await getProfileByUserId(userId));
  return db
    .select()
    .from(educations)
    .where(eq(educations.profileId, profile.id))
    .orderBy(educations.passOutYear);
}

export async function createEducation(userId: string, data: EducationInput) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const [created] = await db
    .insert(educations)
    .values({ profileId: profile.id, ...data })
    .returning();
  return created;
}

export async function updateEducation(
  userId: string,
  educationId: number,
  data: EducationInput,
) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const [updated] = await db
    .update(educations)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(educations.id, educationId),
        eq(educations.profileId, profile.id),
      ),
    )
    .returning();
  if (!updated) throw new ApiError(404, "Education not found");
  return updated;
}

export async function deleteEducation(userId: string, educationId: number) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const deleted = await db
    .delete(educations)
    .where(
      and(
        eq(educations.id, educationId),
        eq(educations.profileId, profile.id),
      ),
    )
    .returning();
  if (deleted.length === 0) throw new ApiError(404, "Education not found");
}

// ─── Projects CRUD ───────────────────────────────────────────

function normalizeProjectDates(data: ProjectInput) {
  return {
    ...data,
    startDate: data.startDate?.trim() ? data.startDate : null,
    endDate: data.endDate?.trim() ? data.endDate : null,
  };
}

export async function getProjects(userId: string) {
  const profile = requireProfile(await getProfileByUserId(userId));
  return db
    .select()
    .from(projects)
    .where(eq(projects.profileId, profile.id))
    .orderBy(projects.startDate);
}

export async function createProject(userId: string, data: ProjectInput) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const payload = normalizeProjectDates(data);
  const [created] = await db
    .insert(projects)
    .values({ profileId: profile.id, ...payload })
    .returning();
  return created;
}

export async function updateProject(
  userId: string,
  projectId: number,
  data: ProjectInput,
) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const payload = normalizeProjectDates(data);
  const [updated] = await db
    .update(projects)
    .set({ ...payload, updatedAt: new Date() })
    .where(
      and(eq(projects.id, projectId), eq(projects.profileId, profile.id)),
    )
    .returning();
  if (!updated) throw new ApiError(404, "Project not found");
  return updated;
}

export async function deleteProject(userId: string, projectId: number) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const deleted = await db
    .delete(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.profileId, profile.id)),
    )
    .returning();
  if (deleted.length === 0) throw new ApiError(404, "Project not found");
}

// ─── IT Skills CRUD ──────────────────────────────────────────

export async function getItSkills(userId: string) {
  const profile = requireProfile(await getProfileByUserId(userId));
  return db
    .select()
    .from(itSkills)
    .where(eq(itSkills.profileId, profile.id))
    .orderBy(itSkills.name);
}

export async function createItSkill(userId: string, data: ItSkillInput) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const [created] = await db
    .insert(itSkills)
    .values({ profileId: profile.id, ...data })
    .returning();
  return created;
}

export async function updateItSkill(
  userId: string,
  skillId: number,
  data: ItSkillInput,
) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const [updated] = await db
    .update(itSkills)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(itSkills.id, skillId), eq(itSkills.profileId, profile.id)),
    )
    .returning();
  if (!updated) throw new ApiError(404, "IT skill not found");
  return updated;
}

export async function deleteItSkill(userId: string, skillId: number) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const deleted = await db
    .delete(itSkills)
    .where(
      and(eq(itSkills.id, skillId), eq(itSkills.profileId, profile.id)),
    )
    .returning();
  if (deleted.length === 0) throw new ApiError(404, "IT skill not found");
}

// ─── Resume ──────────────────────────────────────────────────

export async function getResume(userId: string) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const [resume] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.profileId, profile.id))
    .limit(1);
  return resume ?? null;
}

export async function upsertResume(
  userId: string,
  fileName: string,
  filePath: string,
) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const existing = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(eq(resumes.profileId, profile.id))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(resumes)
      .set({ fileName, filePath, uploadedAt: new Date() })
      .where(eq(resumes.profileId, profile.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(resumes)
    .values({ profileId: profile.id, fileName, filePath })
    .returning();
  return created;
}

export async function deleteResume(userId: string) {
  const profile = requireProfile(await getProfileByUserId(userId));
  const deleted = await db
    .delete(resumes)
    .where(eq(resumes.profileId, profile.id))
    .returning();
  if (deleted.length === 0) throw new ApiError(404, "No resume found");
  return deleted[0];
}

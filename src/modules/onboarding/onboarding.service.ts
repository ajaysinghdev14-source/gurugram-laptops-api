import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles, profileSkills } from "../../db/schema/index.js";
import type { SaveProfileBody, SavePreferencesBody } from "./onboarding.types.js";

export async function getOnboardingStatus(userId: string) {
  const [profile] = await db
    .select({
      id: profiles.id,
      profileCompleted: profiles.profileCompleted,
      preferredRoleId: profiles.preferredRoleId,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) {
    return { hasProfile: false, profileCompleted: false, hasPreferences: false };
  }

  return {
    hasProfile: true,
    profileCompleted: profile.profileCompleted ?? false,
    hasPreferences: !!profile.preferredRoleId,
  };
}

export async function saveProfile(userId: string, data: SaveProfileBody) {
  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(profiles)
      .set({
        fullName: data.fullName,
        gender: data.gender,
        educationLevel: data.educationLevel,
        hasExperience: data.hasExperience,
        experienceLevel: data.experienceLevel ?? null,
        currentSalary: data.currentSalary ?? null,
        preferredCityId: data.preferredCityId,
        preferredLocalityId: data.preferredLocalityId ?? null,
        whatsappUpdates: data.whatsappUpdates ?? false,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      userId,
      fullName: data.fullName,
      gender: data.gender,
      educationLevel: data.educationLevel,
      hasExperience: data.hasExperience,
      experienceLevel: data.experienceLevel ?? null,
      currentSalary: data.currentSalary ?? null,
      preferredCityId: data.preferredCityId,
      preferredLocalityId: data.preferredLocalityId ?? null,
      whatsappUpdates: data.whatsappUpdates ?? false,
    })
    .returning();

  return created;
}

export async function savePreferences(
  userId: string,
  data: SavePreferencesBody,
) {
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Profile not found. Complete basic profile first.");
  }

  await db
    .update(profiles)
    .set({
      preferredRoleId: data.preferredRoleId,
      profileCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id));

  // Replace existing profile skills
  await db
    .delete(profileSkills)
    .where(eq(profileSkills.profileId, profile.id));

  if (data.skillIds.length > 0) {
    await db.insert(profileSkills).values(
      data.skillIds.map((skillId) => ({
        profileId: profile.id,
        skillId,
      })),
    );
  }

  const [updated] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profile.id))
    .limit(1);

  return updated;
}

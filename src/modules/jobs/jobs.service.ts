import { eq, and, desc, sql, ilike, or, inArray, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  jobs,
  jobSkills,
  savedJobs,
  applications,
  skills,
  cities,
  profiles,
  profileSkills,
} from "../../db/schema/index.js";
import { ApiError } from "../../utils/apiError.js";
import type { JobSearchInput, CreateJobInput } from "./jobs.types.js";

// ─── Helpers ─────────────────────────────────────────────────

async function enrichJob(job: typeof jobs.$inferSelect) {
  const jobSkillRows = await db
    .select({
      skillId: jobSkills.skillId,
      skillName: skills.name,
    })
    .from(jobSkills)
    .innerJoin(skills, eq(jobSkills.skillId, skills.id))
    .where(eq(jobSkills.jobId, job.id));

  let cityName = null;
  if (job.cityId) {
    const [city] = await db
      .select({ name: cities.name })
      .from(cities)
      .where(eq(cities.id, job.cityId))
      .limit(1);
    cityName = city?.name ?? null;
  }

  return { ...job, cityName, skills: jobSkillRows };
}

async function addSavedAppliedToJobs(
  enrichedJobs: Awaited<ReturnType<typeof enrichJob>>[],
  userId: string,
) {
  if (enrichedJobs.length === 0) return enrichedJobs;
  const jobIds = enrichedJobs.map((j) => j.id);

  const [savedRows, appliedRows] = await Promise.all([
    db
      .select({ jobId: savedJobs.jobId })
      .from(savedJobs)
      .where(
        and(eq(savedJobs.userId, userId), inArray(savedJobs.jobId, jobIds))),
    db
      .select({ jobId: applications.jobId })
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          inArray(applications.jobId, jobIds),
        ),
      ),
  ]);

  const savedSet = new Set(savedRows.map((r) => r.jobId));
  const appliedSet = new Set(appliedRows.map((r) => r.jobId));

  return enrichedJobs.map((job) => ({
    ...job,
    isSaved: savedSet.has(job.id),
    isApplied: appliedSet.has(job.id),
  }));
}

// ─── Paginated Job List ──────────────────────────────────────

export async function getJobs(
  page: number,
  size: number,
  userId?: string,
) {
  const offset = (page - 1) * size;

  const jobList = await db
    .select()
    .from(jobs)
    .where(eq(jobs.isActive, true))
    .orderBy(desc(jobs.createdAt))
    .limit(size)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(jobs)
    .where(eq(jobs.isActive, true));

  let enriched = await Promise.all(jobList.map(enrichJob));
  if (userId) {
    enriched = await addSavedAppliedToJobs(enriched, userId);
  }

  const totalPages = Math.ceil(total / size);

  return {
    jobs: enriched,
    totalElements: total,
    hasNext: page < totalPages,
    pagination: { page, size, total, totalPages },
  };
}

// ─── Search Jobs ─────────────────────────────────────────────

export async function searchJobs(
  filters: JobSearchInput,
  page: number,
  size: number,
  userId?: string,
) {
  const conditions = [eq(jobs.isActive, true)];

  if (filters.keyword) {
    const kw = `%${filters.keyword}%`;
    conditions.push(
      or(ilike(jobs.title, kw), ilike(jobs.company, kw), ilike(jobs.description, kw))!,
    );
  }
  if (filters.locationType) {
    conditions.push(eq(jobs.locationType, filters.locationType));
  }
  if (filters.employmentType) {
    conditions.push(eq(jobs.employmentType, filters.employmentType));
  }
  if (filters.cityId) {
    conditions.push(eq(jobs.cityId, filters.cityId));
  }
  if (filters.experienceLevel !== undefined) {
    conditions.push(
      sql`${jobs.experienceMinYears} <= ${filters.experienceLevel}`,
    );
  }
  if (filters.salaryMin !== undefined) {
    conditions.push(
      sql`${jobs.salaryMax} >= ${filters.salaryMin}`,
    );
  }

  const where = and(...conditions);
  const offset = (page - 1) * size;

  const jobList = await db
    .select()
    .from(jobs)
    .where(where)
    .orderBy(desc(jobs.isFeatured), desc(jobs.createdAt))
    .limit(size)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(jobs)
    .where(where);

  let enriched = await Promise.all(jobList.map(enrichJob));
  if (userId) {
    enriched = await addSavedAppliedToJobs(enriched, userId);
  }
  const totalPages = Math.ceil(total / size);

  return {
    jobs: enriched,
    totalElements: total,
    hasNext: page < totalPages,
    pagination: { page, size, total, totalPages },
  };
}

// ─── Recommended Jobs ────────────────────────────────────────

export async function getRecommendedJobs(
  userId: string,
  page: number,
  size: number,
) {
  const [profile] = await db
    .select({
      id: profiles.id,
      preferredRoleId: profiles.preferredRoleId,
      preferredCityId: profiles.preferredCityId,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) {
    return getJobs(page, size);
  }

  // Get user's skill IDs
  const userSkillRows = await db
    .select({ skillId: profileSkills.skillId })
    .from(profileSkills)
    .where(eq(profileSkills.profileId, profile.id));

  const userSkillIds = userSkillRows.map((r) => r.skillId);

  // Find jobs that match user's skills
  let matchingJobIds: number[] = [];
  if (userSkillIds.length > 0) {
    const matchedJobs = await db
      .select({ jobId: jobSkills.jobId })
      .from(jobSkills)
      .where(inArray(jobSkills.skillId, userSkillIds));
    matchingJobIds = [...new Set(matchedJobs.map((r) => r.jobId))];
  }

  // Jobs in user's preferred role (e.g. Software Engineer, Digital Marketing)
  let roleJobIds: number[] = [];
  if (profile.preferredRoleId) {
    const roleJobs = await db
      .select({ jobId: jobSkills.jobId })
      .from(jobSkills)
      .innerJoin(skills, eq(jobSkills.skillId, skills.id))
      .where(eq(skills.roleId, profile.preferredRoleId));
    roleJobIds = [...new Set(roleJobs.map((r) => r.jobId))];
  }

  // Show all active jobs (no filter), but order by relevance so preferred-role/skills appear first
  const where = eq(jobs.isActive, true);
  const offset = (page - 1) * size;

  const orderByClauses: (ReturnType<typeof desc> | ReturnType<typeof sql>)[] = [];
  if (roleJobIds.length > 0) {
    orderByClauses.push(
      sql`CASE WHEN (${inArray(jobs.id, roleJobIds)}) THEN 0 ELSE 1 END`,
    );
  }
  if (matchingJobIds.length > 0) {
    orderByClauses.push(
      sql`CASE WHEN (${inArray(jobs.id, matchingJobIds)}) THEN 0 ELSE 1 END`,
    );
  }
  orderByClauses.push(desc(jobs.isFeatured), desc(jobs.createdAt));

  const jobList = await db
    .select()
    .from(jobs)
    .where(where)
    .orderBy(...orderByClauses)
    .limit(size)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(jobs)
    .where(where);

  let enriched = await Promise.all(jobList.map(enrichJob));
  enriched = await addSavedAppliedToJobs(enriched, userId);
  const totalPages = Math.ceil(total / size);

  return {
    jobs: enriched,
    totalElements: total,
    hasNext: page < totalPages,
    pagination: { page, size, total, totalPages },
  };
}

// ─── Job Detail ──────────────────────────────────────────────

export async function getJobDetail(jobId: number, userId?: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) throw new ApiError(404, "Job not found");

  const enriched = await enrichJob(job);

  let isSaved = false;
  let isApplied = false;

  if (userId) {
    const [saved] = await db
      .select({ id: savedJobs.id })
      .from(savedJobs)
      .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
      .limit(1);
    isSaved = !!saved;

    const [applied] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(eq(applications.userId, userId), eq(applications.jobId, jobId)),
      )
      .limit(1);
    isApplied = !!applied;
  }

  return { ...enriched, isSaved, isApplied };
}

// ─── Save / Unsave Jobs ─────────────────────────────────────

export async function saveJob(userId: string, jobId: number) {
  const [existing] = await db
    .select({ id: savedJobs.id })
    .from(savedJobs)
    .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
    .limit(1);
  if (existing) return existing;

  const [saved] = await db
    .insert(savedJobs)
    .values({ userId, jobId })
    .returning();
  return saved;
}

export async function unsaveJob(userId: string, jobId: number) {
  const deleted = await db
    .delete(savedJobs)
    .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
    .returning();
  if (deleted.length === 0) throw new ApiError(404, "Saved job not found");
}

export async function getSavedJobs(userId: string, page: number, size: number) {
  const offset = (page - 1) * size;

  const savedRows = await db
    .select()
    .from(savedJobs)
    .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .where(eq(savedJobs.userId, userId))
    .orderBy(desc(savedJobs.createdAt))
    .limit(size)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(savedJobs)
    .where(eq(savedJobs.userId, userId));

  const enriched = await Promise.all(
    savedRows.map(async (row) => {
      const e = await enrichJob(row.jobs);
      return { ...e, savedAt: row.saved_jobs.createdAt };
    }),
  );
  const totalPages = Math.ceil(total / size);

  return {
    jobs: enriched,
    totalElements: total,
    hasNext: page < totalPages,
    pagination: { page, size, total, totalPages },
  };
}

export async function getSavedJobIds(userId: string) {
  const rows = await db
    .select({ jobId: savedJobs.jobId })
    .from(savedJobs)
    .where(eq(savedJobs.userId, userId));
  return rows.map((r) => r.jobId);
}

// ─── Applications ────────────────────────────────────────────

export async function applyToJob(
  userId: string,
  jobId: number,
  coverLetter?: string,
) {
  const [existing] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(eq(applications.userId, userId), eq(applications.jobId, jobId)),
    )
    .limit(1);
  if (existing)
    throw new ApiError(409, "Already applied to this job");

  const [app] = await db
    .insert(applications)
    .values({ userId, jobId, coverLetter: coverLetter ?? null })
    .returning();
  return app;
}

export async function getUserApplications(userId: string) {
  const rows = await db
    .select()
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.appliedAt));

  return Promise.all(
    rows.map(async (row) => {
      const enriched = await enrichJob(row.jobs);
      return {
        application: row.applications,
        job: enriched,
      };
    }),
  );
}

export async function getApplicationDetail(
  userId: string,
  applicationId: number,
) {
  const [row] = await db
    .select()
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.userId, userId),
      ),
    )
    .limit(1);

  if (!row) throw new ApiError(404, "Application not found");

  const enriched = await enrichJob(row.jobs);
  return { application: row.applications, job: enriched };
}

export async function getAppliedJobIds(userId: string) {
  const rows = await db
    .select({ jobId: applications.jobId })
    .from(applications)
    .where(eq(applications.userId, userId));
  return rows.map((r) => r.jobId);
}

// ─── Dashboard Stats ─────────────────────────────────────────

export async function getDashboardStats(userId: string) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [{ newJobsToday }] = await db
    .select({ newJobsToday: count() })
    .from(jobs)
    .where(
      and(
        eq(jobs.isActive, true),
        sql`${jobs.createdAt} >= ${todayStr}::date`,
      ),
    );

  const [{ applicationsSent }] = await db
    .select({ applicationsSent: count() })
    .from(applications)
    .where(eq(applications.userId, userId));

  const [{ savedJobsCount }] = await db
    .select({ savedJobsCount: count() })
    .from(savedJobs)
    .where(eq(savedJobs.userId, userId));

  const [{ interviewCalls }] = await db
    .select({ interviewCalls: count() })
    .from(applications)
    .where(
      and(
        eq(applications.userId, userId),
        eq(applications.status, "INTERVIEW_SCHEDULED"),
      ),
    );

  return {
    newJobsToday,
    applicationsSent,
    savedJobs: savedJobsCount,
    interviewCalls,
  };
}

// ─── Admin Job Management ────────────────────────────────────

export async function getAdminStats() {
  const [{ totalJobs }] = await db
    .select({ totalJobs: count() })
    .from(jobs);

  const [{ activeJobs }] = await db
    .select({ activeJobs: count() })
    .from(jobs)
    .where(eq(jobs.isActive, true));

  const [{ totalApplications }] = await db
    .select({ totalApplications: count() })
    .from(applications);

  return { totalJobs, activeJobs, totalApplications };
}

export async function getAdminJobs(page: number, size: number) {
  const offset = (page - 1) * size;

  const jobList = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(size)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(jobs);

  const enriched = await Promise.all(jobList.map(enrichJob));

  return {
    jobs: enriched,
    pagination: { page, size, total, totalPages: Math.ceil(total / size) },
  };
}

export async function createJob(adminId: string, data: CreateJobInput) {
  const { skillIds, ...jobData } = data;
  const [created] = await db
    .insert(jobs)
    .values({ ...jobData, postedBy: adminId })
    .returning();

  if (skillIds && skillIds.length > 0) {
    await db.insert(jobSkills).values(
      skillIds.map((skillId) => ({ jobId: created.id, skillId })),
    );
  }

  return enrichJob(created);
}

export async function updateJob(jobId: number, data: CreateJobInput) {
  const { skillIds, ...jobData } = data;
  const [updated] = await db
    .update(jobs)
    .set({ ...jobData, updatedAt: new Date() })
    .where(eq(jobs.id, jobId))
    .returning();

  if (!updated) throw new ApiError(404, "Job not found");

  if (skillIds) {
    await db.delete(jobSkills).where(eq(jobSkills.jobId, jobId));
    if (skillIds.length > 0) {
      await db.insert(jobSkills).values(
        skillIds.map((skillId) => ({ jobId, skillId })),
      );
    }
  }

  return enrichJob(updated);
}

export async function deleteJob(jobId: number) {
  const deleted = await db
    .delete(jobs)
    .where(eq(jobs.id, jobId))
    .returning();
  if (deleted.length === 0) throw new ApiError(404, "Job not found");
}

export async function toggleJobStatus(jobId: number, isActive: boolean) {
  const [updated] = await db
    .update(jobs)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(jobs.id, jobId))
    .returning();
  if (!updated) throw new ApiError(404, "Job not found");
  return updated;
}

export async function updateApplicationStatus(
  applicationId: number,
  status: string,
) {
  const [updated] = await db
    .update(applications)
    .set({ status, updatedAt: new Date() })
    .where(eq(applications.id, applicationId))
    .returning();
  if (!updated) throw new ApiError(404, "Application not found");
  return updated;
}

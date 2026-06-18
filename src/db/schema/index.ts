import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  serial,
  integer,
  boolean,
  text,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Module 1: Auth ──────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  provider: varchar("provider", { length: 20 }).notNull().default("email"),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    deviceInfo: varchar("device_info", { length: 255 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("refresh_tokens_token_hash_idx").on(table.tokenHash),
    index("refresh_tokens_user_id_idx").on(table.userId),
  ],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 20 }).notNull(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_tokens_identifier_type_idx").on(table.identifier, table.type),
  ],
);

// ─── Module 2: Master Data ───────────────────────────────────

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const localities = pgTable(
  "localities",
  {
    id: serial("id").primaryKey(),
    cityId: integer("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("localities_city_id_idx").on(table.cityId)],
);

export const jobRoles = pgTable("job_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const skills = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    roleId: integer("role_id")
      .notNull()
      .references(() => jobRoles.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("skills_role_id_idx").on(table.roleId)],
);

// ─── Module 2+3: Profiles ────────────────────────────────────

export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 255 }),
    gender: varchar("gender", { length: 10 }),
    educationLevel: varchar("education_level", { length: 30 }),
    hasExperience: boolean("has_experience"),
    experienceLevel: varchar("experience_level", { length: 30 }),
    currentSalary: integer("current_salary"),
    preferredCityId: integer("preferred_city_id").references(() => cities.id),
    preferredLocalityId: integer("preferred_locality_id").references(
      () => localities.id,
    ),
    whatsappUpdates: boolean("whatsapp_updates").default(false),
    preferredRoleId: integer("preferred_role_id").references(() => jobRoles.id),
    headline: varchar("headline", { length: 250 }),
    summary: text("summary"),
    noticePeriod: varchar("notice_period", { length: 30 }),
    profileCompleted: boolean("profile_completed").default(false),
    profilePicture: varchar("profile_picture", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("profiles_user_id_idx").on(table.userId)],
);

export const profileSkills = pgTable(
  "profile_skills",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [index("profile_skills_profile_id_idx").on(table.profileId)],
);

// ─── Module 3: Profile Sub-tables ────────────────────────────

export const personalDetails = pgTable("personal_details", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  dateOfBirth: date("date_of_birth"),
  maritalStatus: varchar("marital_status", { length: 20 }),
  address: text("address"),
  pincode: varchar("pincode", { length: 10 }),
  nationality: varchar("nationality", { length: 50 }),
});

export const employments = pgTable(
  "employments",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    designation: varchar("designation", { length: 255 }).notNull(),
    company: varchar("company", { length: 255 }).notNull(),
    employmentType: varchar("employment_type", { length: 20 }),
    isCurrent: boolean("is_current").default(false),
    startDate: date("start_date"),
    endDate: date("end_date"),
    description: text("description"),
    noticePeriod: varchar("notice_period", { length: 30 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("employments_profile_id_idx").on(table.profileId)],
);

export const educations = pgTable(
  "educations",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    degree: varchar("degree", { length: 100 }).notNull(),
    specialization: varchar("specialization", { length: 100 }),
    institution: varchar("institution", { length: 255 }).notNull(),
    passOutYear: integer("pass_out_year"),
    gradeType: varchar("grade_type", { length: 20 }),
    grade: varchar("grade", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("educations_profile_id_idx").on(table.profileId)],
);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    isOngoing: boolean("is_ongoing").default(false),
    projectUrl: varchar("project_url", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("projects_profile_id_idx").on(table.profileId)],
);

export const itSkills = pgTable(
  "it_skills",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    proficiency: varchar("proficiency", { length: 20 }).default("BEGINNER"),
    experienceMonths: integer("experience_months").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("it_skills_profile_id_idx").on(table.profileId)],
);

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 512 }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Module 4: Jobs ──────────────────────────────────────────

export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    company: varchar("company", { length: 255 }).notNull(),
    companyLogo: varchar("company_logo", { length: 512 }),
    description: text("description"),
    requirements: text("requirements"),
    cityId: integer("city_id").references(() => cities.id),
    locationType: varchar("location_type", { length: 20 }).default("ONSITE"),
    employmentType: varchar("employment_type", { length: 20 }).default(
      "FULL_TIME",
    ),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    isSalaryDisclosed: boolean("is_salary_disclosed").default(true),
    experienceMinYears: integer("experience_min_years").default(0),
    experienceMaxYears: integer("experience_max_years"),
    minEducation: varchar("min_education", { length: 30 }),
    vacancies: integer("vacancies").default(1),
    applicationDeadline: date("application_deadline"),
    isFeatured: boolean("is_featured").default(false),
    isActive: boolean("is_active").default(true),
    postedBy: uuid("posted_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("jobs_city_id_idx").on(table.cityId),
    index("jobs_is_active_idx").on(table.isActive),
  ],
);

export const jobSkills = pgTable(
  "job_skills",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [index("job_skills_job_id_idx").on(table.jobId)],
);

export const savedJobs = pgTable(
  "saved_jobs",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("saved_jobs_user_job_idx").on(table.userId, table.jobId),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 30 }).notNull().default("PENDING"),
    coverLetter: text("cover_letter"),
    appliedAt: timestamp("applied_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("applications_user_job_idx").on(table.userId, table.jobId),
    index("applications_user_id_idx").on(table.userId),
    index("applications_job_id_idx").on(table.jobId),
  ],
);

// ─── Relations ───────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  refreshTokens: many(refreshTokens),
  profile: one(profiles),
  savedJobs: many(savedJobs),
  applications: many(applications),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const citiesRelations = relations(cities, ({ many }) => ({
  localities: many(localities),
}));

export const localitiesRelations = relations(localities, ({ one }) => ({
  city: one(cities, {
    fields: [localities.cityId],
    references: [cities.id],
  }),
}));

export const jobRolesRelations = relations(jobRoles, ({ many }) => ({
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  role: one(jobRoles, {
    fields: [skills.roleId],
    references: [jobRoles.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  preferredCity: one(cities, {
    fields: [profiles.preferredCityId],
    references: [cities.id],
  }),
  preferredLocality: one(localities, {
    fields: [profiles.preferredLocalityId],
    references: [localities.id],
  }),
  preferredRole: one(jobRoles, {
    fields: [profiles.preferredRoleId],
    references: [jobRoles.id],
  }),
  profileSkills: many(profileSkills),
  personalDetails: one(personalDetails),
  employments: many(employments),
  educations: many(educations),
  projects: many(projects),
  itSkills: many(itSkills),
  resume: one(resumes),
}));

export const profileSkillsRelations = relations(profileSkills, ({ one }) => ({
  profile: one(profiles, {
    fields: [profileSkills.profileId],
    references: [profiles.id],
  }),
  skill: one(skills, {
    fields: [profileSkills.skillId],
    references: [skills.id],
  }),
}));

export const personalDetailsRelations = relations(
  personalDetails,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [personalDetails.profileId],
      references: [profiles.id],
    }),
  }),
);

export const employmentsRelations = relations(employments, ({ one }) => ({
  profile: one(profiles, {
    fields: [employments.profileId],
    references: [profiles.id],
  }),
}));

export const educationsRelations = relations(educations, ({ one }) => ({
  profile: one(profiles, {
    fields: [educations.profileId],
    references: [profiles.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  profile: one(profiles, {
    fields: [projects.profileId],
    references: [profiles.id],
  }),
}));

export const itSkillsRelations = relations(itSkills, ({ one }) => ({
  profile: one(profiles, {
    fields: [itSkills.profileId],
    references: [profiles.id],
  }),
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  profile: one(profiles, {
    fields: [resumes.profileId],
    references: [profiles.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  city: one(cities, {
    fields: [jobs.cityId],
    references: [cities.id],
  }),
  postedByUser: one(users, {
    fields: [jobs.postedBy],
    references: [users.id],
  }),
  jobSkills: many(jobSkills),
  savedJobs: many(savedJobs),
  applications: many(applications),
}));

export const jobSkillsRelations = relations(jobSkills, ({ one }) => ({
  job: one(jobs, {
    fields: [jobSkills.jobId],
    references: [jobs.id],
  }),
  skill: one(skills, {
    fields: [jobSkills.skillId],
    references: [skills.id],
  }),
}));

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  user: one(users, {
    fields: [savedJobs.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [savedJobs.jobId],
    references: [jobs.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
}));

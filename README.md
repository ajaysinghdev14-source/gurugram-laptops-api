# SortOut Jobs Backend

A job platform backend (Naukri style) — Node.js, TypeScript, Express, Drizzle ORM, PostgreSQL.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Runtime     | Node.js + TypeScript (ESM)          |
| Framework   | Express 4.x                         |
| Database    | PostgreSQL 16 (Docker)               |
| ORM         | Drizzle ORM + postgres.js           |
| Validation  | Zod                                 |
| Auth        | JWT (jsonwebtoken) + bcryptjs       |
| File Upload | Multer                              |
| Security    | Helmet, CORS, cookie-parser         |
| Email       | Resend API                          |
| SMS/OTP     | Twilio                              |
| Logging     | Morgan                              |
| Dev Tools   | tsx (watch mode), drizzle-kit        |
| Testing     | Vitest + Supertest                  |

---

## Project Structure

```
sortout-backend/
├── README.md
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── docker-compose.yml
├── uploads/resumes/               # Uploaded resume files
├── drizzle/                       # SQL migration files
├── testing-routes/                # Vitest tests + Postman collection
│   ├── postman-collection.json
│   ├── README.md
│   └── module/
│       ├── auth.routes.test.ts
│       ├── master-data.routes.test.ts
│       ├── onboarding.routes.test.ts
│       ├── profile.routes.test.ts
│       └── jobs.routes.test.ts
└── src/
    ├── index.ts                   # Server entry
    ├── app.ts                     # Express app + all route mounts
    ├── config/
    │   └── env.ts                 # Zod-validated environment vars
    ├── db/
    │   ├── index.ts               # Drizzle client + testConnection()
    │   ├── seed.ts                # Master data + sample jobs seeder
    │   └── schema/
    │       └── index.ts           # All tables + relations
    ├── utils/
    │   ├── apiError.ts
    │   ├── apiResponse.ts
    │   └── asyncHandler.ts
    ├── middlewares/
    │   ├── error.middleware.ts
    │   ├── auth.middleware.ts      # requireAuth (JWT)
    │   └── admin.middleware.ts     # requireAdmin (role check)
    └── modules/
        ├── user-management/       # Module 1: Auth
        │   ├── user.types.ts
        │   ├── user.service.ts
        │   ├── token.service.ts
        │   ├── auth.controller.ts
        │   ├── auth.router.ts
        │   ├── email.service.ts
        │   ├── googleAuth.service.ts
        │   ├── twilio.service.ts
        │   └── rate-limit.ts
        ├── master-data/           # Module 2: Master Data
        │   ├── master.service.ts
        │   ├── master.controller.ts
        │   └── master.router.ts
        ├── onboarding/            # Module 2: Onboarding
        │   ├── onboarding.types.ts
        │   ├── onboarding.service.ts
        │   ├── onboarding.controller.ts
        │   └── onboarding.router.ts
        ├── profile/               # Module 3: Profile
        │   ├── profile.types.ts
        │   ├── profile.service.ts
        │   ├── profile.controller.ts
        │   └── profile.router.ts
        ├── jobs/                  # Module 4: Jobs
        │   ├── jobs.types.ts
        │   ├── jobs.service.ts
        │   ├── jobs.controller.ts
        │   └── jobs.router.ts
        └── admin/                 # Module 4: Admin
            ├── admin.controller.ts
            └── admin.router.ts
```

---

## Modules

| # | Module | Status | Description |
|---|--------|--------|-------------|
| 0 | Project Init | Done | Docker, deps, config, DB, utils, error middleware |
| 1 | User Management | Done | Register, login, JWT, refresh, email verify, password reset, OTP, Google OAuth, identity linking |
| 2 | Onboarding + Master Data | Done | Cities, localities, job roles, skills, 5-step onboarding profile+preferences |
| 3 | Profile | Done | Full profile CRUD (personal details, employment, education, projects, IT skills, resume upload) |
| 4 | Jobs + Dashboard + Admin | Done | Job listing, search, recommendations, save/unsave, apply, dashboard stats, admin CRUD |

---

## Database Tables (18 total)

### Auth (Module 1)
- `users`, `refresh_tokens`, `auth_tokens`

### Master Data (Module 2)
- `cities`, `localities`, `job_roles`, `skills`

### Profiles (Module 2+3)
- `profiles`, `profile_skills`, `personal_details`, `employments`, `educations`, `projects`, `it_skills`, `resumes`

### Jobs (Module 4)
- `jobs`, `job_skills`, `saved_jobs`, `applications`

---

## How to Run

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment

Copy `.env.example` to `.env` and fill in:

```
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://sortout_user:sortout_pass@localhost:5432/sortout_jobs
ACCESS_TOKEN_SECRET=<long-random-string>
REFRESH_TOKEN_SECRET=<long-random-string>
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=<resend-api-key>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_PHONE_NUMBER=<twilio-number>
```

### 4. Run migrations + seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the server

```bash
npm run dev
```

Server runs on `http://localhost:8000`. Health check: `GET /health`.

---

## API Endpoints (~55 total)

### Module 1 — Auth (14 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register (email + password) |
| POST | /api/auth/login | No | Login (email + password) |
| POST | /api/auth/logout | No | Revoke refresh token |
| POST | /api/auth/refresh | No | Rotate refresh token |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/auth/verify-email | No | Verify email token |
| POST | /api/auth/resend-verify-email | No | Resend verify link |
| POST | /api/auth/forgot-password | No | Send reset link |
| POST | /api/auth/reset-password | No | Reset with token |
| POST | /api/auth/request-otp | No | Send OTP to phone |
| POST | /api/auth/verify-otp | No | Verify OTP + login/register |
| POST | /api/auth/google | No | Google OAuth login |
| POST | /api/auth/link-phone | Yes | Link phone to account |
| POST | /api/auth/link-email | Yes | Link email to account |

### Module 2 — Master Data + Onboarding (7 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/master/cities | No | List all cities |
| GET | /api/master/cities/:cityId/localities | No | Localities for a city |
| GET | /api/master/roles | No | List all job roles |
| GET | /api/master/roles/:roleId/skills | No | Skills for a role |
| GET | /api/onboarding/status/:userId | Yes | Onboarding completion status |
| POST | /api/onboarding/profile/:userId | Yes | Save basic profile |
| POST | /api/onboarding/preferences/:userId | Yes | Save role + skills |

### Module 3 — Profile (24 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/profile/:userId | Yes | Full profile (all sections) |
| PUT | /api/profile/:userId | Yes | Update basic fields |
| PUT | /api/profile/:userId/basic | Yes | Update basic fields (alias) |
| PUT | /api/profile/:userId/headline | Yes | Update headline |
| PUT | /api/profile/:userId/summary | Yes | Update summary |
| GET | /api/profile/:userId/personal-details | Yes | Get personal details |
| PUT | /api/profile/:userId/personal-details | Yes | Upsert personal details |
| GET | /api/profile/:userId/employments | Yes | List employments |
| POST | /api/profile/:userId/employments | Yes | Create employment |
| PUT | /api/profile/:userId/employments/:id | Yes | Update employment |
| DELETE | /api/profile/:userId/employments/:id | Yes | Delete employment |
| GET | /api/profile/:userId/educations | Yes | List educations |
| POST | /api/profile/:userId/educations | Yes | Create education |
| PUT | /api/profile/:userId/educations/:id | Yes | Update education |
| DELETE | /api/profile/:userId/educations/:id | Yes | Delete education |
| GET | /api/profile/:userId/projects | Yes | List projects |
| POST | /api/profile/:userId/projects | Yes | Create project |
| PUT | /api/profile/:userId/projects/:id | Yes | Update project |
| DELETE | /api/profile/:userId/projects/:id | Yes | Delete project |
| GET | /api/profile/:userId/it-skills | Yes | List IT skills |
| POST | /api/profile/:userId/it-skills | Yes | Create IT skill |
| PUT | /api/profile/:userId/it-skills/:id | Yes | Update IT skill |
| DELETE | /api/profile/:userId/it-skills/:id | Yes | Delete IT skill |
| POST | /api/profile/:userId/resume | Yes | Upload resume (PDF/DOC/DOCX, 5MB) |
| DELETE | /api/profile/:userId/resume | Yes | Delete resume |

### Module 4 — Jobs + Dashboard (13 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/jobs | No | Paginated job list |
| POST | /api/jobs/search | No | Search with filters |
| GET | /api/jobs/:jobId | No | Job detail (+isSaved/isApplied) |
| GET | /api/jobs/recommended/:userId | Yes | Recommended jobs |
| POST | /api/jobs/:jobId/save/:userId | Yes | Save a job |
| DELETE | /api/jobs/:jobId/save/:userId | Yes | Unsave a job |
| GET | /api/jobs/saved/:userId | Yes | Saved jobs list |
| GET | /api/jobs/saved/:userId/ids | Yes | Saved job IDs |
| POST | /api/jobs/:jobId/apply/:userId | Yes | Apply to job |
| GET | /api/jobs/applications/:userId | Yes | My applications |
| GET | /api/jobs/applications/:userId/:id | Yes | Application detail |
| GET | /api/jobs/applied/:userId/ids | Yes | Applied job IDs |
| GET | /api/jobs/stats/:userId | Yes | Dashboard stats |

### Module 4 — Admin (7 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/admin/jobs/stats | Admin | Admin stats |
| GET | /api/admin/jobs | Admin | List all jobs |
| POST | /api/admin/jobs/:adminId | Admin | Create job |
| PUT | /api/admin/jobs/:jobId | Admin | Update job |
| DELETE | /api/admin/jobs/:jobId | Admin | Delete job |
| PATCH | /api/admin/jobs/:jobId/status | Admin | Toggle active status |
| PATCH | /api/admin/jobs/applications/:id/status | Admin | Update application status |

---

## Testing

96 automated tests across 5 test files:

```bash
npm test      # run all 96 tests
```

See `testing-routes/README.md` for detailed coverage table.

---

## Seed Data

The seed script (`npm run db:seed`) populates:

- 20 Indian cities with 100 localities
- 20 job roles with 146 skills
- 25 sample jobs with skills from real companies (TCS, Infosys, Flipkart, Razorpay, etc.)

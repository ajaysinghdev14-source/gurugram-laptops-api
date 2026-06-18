# SortOut Jobs - API Test Coverage

## Running Tests

```bash
npm test          # run all tests
npm run test:watch # watch mode
npx vitest run testing-routes/module/auth.routes.test.ts       # auth only
npx vitest run testing-routes/module/master-data.routes.test.ts # master data
npx vitest run testing-routes/module/onboarding.routes.test.ts  # onboarding
npx vitest run testing-routes/module/profile.routes.test.ts     # profile
npx vitest run testing-routes/module/jobs.routes.test.ts        # jobs
```

## Test Files

| File | Module | Tests |
|------|--------|-------|
| `auth.routes.test.ts` | Module 1: Auth | 45 |
| `master-data.routes.test.ts` | Module 2: Master Data | 6 |
| `onboarding.routes.test.ts` | Module 2: Onboarding | 7 |
| `profile.routes.test.ts` | Module 3: Profile | 23 |
| `jobs.routes.test.ts` | Module 4: Jobs | 15 |
| **Total** | | **96** |

## Endpoint Coverage

### Module 1 - Auth (10 endpoints)

| Method | Endpoint | Test |
|--------|----------|------|
| POST | `/api/auth/register` | ✅ |
| POST | `/api/auth/login` | ✅ |
| GET | `/api/auth/me` | ✅ |
| POST | `/api/auth/refresh` | ✅ |
| POST | `/api/auth/logout` | ✅ |
| POST | `/api/auth/verify-email` | ✅ |
| POST | `/api/auth/resend-verify-email` | ✅ |
| POST | `/api/auth/forgot-password` | ✅ |
| POST | `/api/auth/reset-password` | ✅ |
| POST | `/api/auth/google` | ✅ |
| POST | `/api/auth/request-otp` | ✅ |
| POST | `/api/auth/verify-otp` | ✅ |
| POST | `/api/auth/link-phone` | ✅ |
| POST | `/api/auth/link-email` | ✅ |

### Module 2 - Master Data + Onboarding (7 endpoints)

| Method | Endpoint | Test |
|--------|----------|------|
| GET | `/api/master/cities` | ✅ |
| GET | `/api/master/cities/:cityId/localities` | ✅ |
| GET | `/api/master/roles` | ✅ |
| GET | `/api/master/roles/:roleId/skills` | ✅ |
| GET | `/api/onboarding/status/:userId` | ✅ |
| POST | `/api/onboarding/profile/:userId` | ✅ |
| POST | `/api/onboarding/preferences/:userId` | ✅ |

### Module 3 - Profile (24 endpoints)

| Method | Endpoint | Test |
|--------|----------|------|
| GET | `/api/profile/:userId` | ✅ |
| PUT | `/api/profile/:userId` | ✅ |
| PUT | `/api/profile/:userId/basic` | ✅ |
| PUT | `/api/profile/:userId/headline` | ✅ |
| PUT | `/api/profile/:userId/summary` | ✅ |
| GET | `/api/profile/:userId/personal-details` | ✅ |
| PUT | `/api/profile/:userId/personal-details` | ✅ |
| GET | `/api/profile/:userId/employments` | ✅ |
| POST | `/api/profile/:userId/employments` | ✅ |
| PUT | `/api/profile/:userId/employments/:id` | ✅ |
| DELETE | `/api/profile/:userId/employments/:id` | ✅ |
| GET | `/api/profile/:userId/educations` | ✅ |
| POST | `/api/profile/:userId/educations` | ✅ |
| PUT | `/api/profile/:userId/educations/:id` | ✅ |
| DELETE | `/api/profile/:userId/educations/:id` | ✅ |
| GET | `/api/profile/:userId/projects` | ✅ |
| POST | `/api/profile/:userId/projects` | ✅ |
| PUT | `/api/profile/:userId/projects/:id` | ✅ |
| DELETE | `/api/profile/:userId/projects/:id` | ✅ |
| GET | `/api/profile/:userId/it-skills` | ✅ |
| POST | `/api/profile/:userId/it-skills` | ✅ |
| PUT | `/api/profile/:userId/it-skills/:id` | ✅ |
| DELETE | `/api/profile/:userId/it-skills/:id` | ✅ |
| POST | `/api/profile/:userId/resume` | (manual) |
| DELETE | `/api/profile/:userId/resume` | (manual) |

### Module 4 - Jobs + Admin (20 endpoints)

| Method | Endpoint | Test |
|--------|----------|------|
| GET | `/api/jobs` | ✅ |
| POST | `/api/jobs/search` | ✅ |
| GET | `/api/jobs/:jobId` | ✅ |
| GET | `/api/jobs/recommended/:userId` | ✅ |
| POST | `/api/jobs/:jobId/save/:userId` | ✅ |
| DELETE | `/api/jobs/:jobId/save/:userId` | ✅ |
| GET | `/api/jobs/saved/:userId` | ✅ |
| GET | `/api/jobs/saved/:userId/ids` | ✅ |
| POST | `/api/jobs/:jobId/apply/:userId` | ✅ |
| GET | `/api/jobs/applications/:userId` | ✅ |
| GET | `/api/jobs/applications/:userId/:id` | (via Postman) |
| GET | `/api/jobs/applied/:userId/ids` | ✅ |
| GET | `/api/jobs/stats/:userId` | ✅ |
| GET | `/api/admin/jobs/stats` | (via Postman) |
| GET | `/api/admin/jobs` | (via Postman) |
| POST | `/api/admin/jobs/:adminId` | (via Postman) |
| PUT | `/api/admin/jobs/:jobId` | (via Postman) |
| DELETE | `/api/admin/jobs/:jobId` | (via Postman) |
| PATCH | `/api/admin/jobs/:jobId/status` | (via Postman) |
| PATCH | `/api/admin/jobs/applications/:id/status` | (via Postman) |

## Postman Collection

Import `postman-collection.json` into Postman. Set collection variables:

- `baseUrl`: `http://localhost:8000`
- `accessToken`: JWT from login/register
- `userId`: User UUID from register/login response
- Other IDs as needed from API responses

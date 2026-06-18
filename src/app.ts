import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { authLimiter } from "./modules/user-management/rate-limit.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { authRouter } from "./modules/user-management/auth.router.js";
import { masterRouter } from "./modules/master-data/master.router.js";
import { onboardingRouter } from "./modules/onboarding/onboarding.router.js";
import { profileRouter } from "./modules/profile/profile.router.js";
import { jobsRouter } from "./modules/jobs/jobs.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

// Module 1: Auth
app.use("/api/auth", authLimiter, authRouter);

// Module 2: Master Data (public) + Onboarding (auth)
app.use("/api/master", masterRouter);
app.use("/api/onboarding", onboardingRouter);

// Module 3: Profile (auth)
app.use("/api/profile", profileRouter);

// Module 4: Jobs (public + auth) + Admin (admin only)
app.use("/api/jobs", jobsRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);

export default app;

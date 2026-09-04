import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

import { requireAuth } from "./middleware/requireAuth.js";
import { authRouter } from "./routes/auth.js";
import { crewmatesRouter } from "./routes/crewmates.js";
import { healthRouter } from "./routes/health.js";
import { leagueGroupsRouter } from "./routes/leagueGroups.js";
import { leagueMembersRouter } from "./routes/leagueMembers.js";
import { leaguesRouter } from "./routes/leagues.js";
import { usersRouter } from "./routes/users.js";
import { ConflictError, NotFoundError } from "./services/errors.js";

export const app = express();

app.use(cors({ credentials: true, origin: process.env.CLIENT_APP_URL ?? true }));
app.use(express.json());
app.use(cookieParser());

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60 });

app.use("/api", healthRouter);
app.use("/api/auth", authRateLimit, authRouter);

// Everything below requires a signed-in session — requireAuth populates
// currentUser.ts's per-request store that these routers/services read via
// getCurrentUserId().
app.use("/api", requireAuth, leaguesRouter);
app.use("/api", requireAuth, leagueGroupsRouter);
app.use("/api", requireAuth, leagueMembersRouter);
app.use("/api", requireAuth, crewmatesRouter);
app.use("/api", requireAuth, usersRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

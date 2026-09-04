import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";

import { crewmatesRouter } from "./routes/crewmates.js";
import { healthRouter } from "./routes/health.js";
import { leagueGroupsRouter } from "./routes/leagueGroups.js";
import { leagueMembersRouter } from "./routes/leagueMembers.js";
import { leaguesRouter } from "./routes/leagues.js";
import { usersRouter } from "./routes/users.js";
import { ConflictError, NotFoundError } from "./services/errors.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", leaguesRouter);
app.use("/api", leagueGroupsRouter);
app.use("/api", leagueMembersRouter);
app.use("/api", crewmatesRouter);
app.use("/api", usersRouter);

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

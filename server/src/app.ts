import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";

import { HttpError } from "./lib/errors.js";
import { currentUserMiddleware } from "./middleware/currentUser.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { healthRouter } from "./routes/health.js";
import { leaguesRouter } from "./routes/leagues.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", currentUserMiddleware, dashboardRouter);
app.use("/api", currentUserMiddleware, leaguesRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

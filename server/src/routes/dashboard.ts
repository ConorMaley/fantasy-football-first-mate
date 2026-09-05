import { Router } from "express";

import { getCurrentUserId } from "../currentUser.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { buildDashboard } from "../lib/dashboardAggregation.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const dashboard = await buildDashboard(getCurrentUserId());
    res.json(dashboard);
  }),
);

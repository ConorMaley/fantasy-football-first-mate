import { Router } from "express";

import { asyncHandler } from "../lib/asyncHandler.js";
import { buildDashboard } from "../lib/dashboardAggregation.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const dashboard = await buildDashboard(req.currentUserId);
    res.json(dashboard);
  }),
);

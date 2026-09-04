import { Router } from "express";

import { getCurrentUserId } from "../currentUser.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import * as leagueGroupService from "../services/leagueGroupService.js";
import * as leagueService from "../services/leagueService.js";

export const leaguesRouter = Router();

leaguesRouter.get(
  "/leagues",
  asyncHandler(async (_req, res) => {
    const leagues = await leagueService.listLeagues(getCurrentUserId());
    res.json(leagues);
  }),
);

leaguesRouter.post(
  "/leagues",
  asyncHandler(async (req, res) => {
    const { platform, externalLeagueId, name, season } = req.body ?? {};
    const league = await leagueService.createLeague(getCurrentUserId(), {
      platform,
      externalLeagueId,
      name,
      season,
    });
    res.status(201).json(league);
  }),
);

leaguesRouter.patch(
  "/leagues/:id",
  asyncHandler(async (req, res) => {
    const userId = getCurrentUserId();
    const { leagueGroupId, ...fields } = req.body ?? {};

    let league = await leagueService.updateLeague(userId, req.params.id, fields);

    if (leagueGroupId !== undefined) {
      league =
        leagueGroupId === null
          ? await leagueGroupService.clearLeagueGroup(userId, req.params.id)
          : await leagueGroupService.assignLeagueToGroup(userId, req.params.id, leagueGroupId);
    }

    res.json(league);
  }),
);

leaguesRouter.delete(
  "/leagues/:id",
  asyncHandler(async (req, res) => {
    await leagueService.deleteLeague(getCurrentUserId(), req.params.id);
    res.status(204).send();
  }),
);

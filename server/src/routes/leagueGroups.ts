import { Router } from "express";

import { getCurrentUserId } from "../currentUser.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import * as leagueGroupService from "../services/leagueGroupService.js";

export const leagueGroupsRouter = Router();

leagueGroupsRouter.get(
  "/league-groups",
  asyncHandler(async (_req, res) => {
    const groups = await leagueGroupService.listLeagueGroups(getCurrentUserId());
    res.json(groups);
  }),
);

leagueGroupsRouter.post(
  "/league-groups",
  asyncHandler(async (req, res) => {
    const { name } = req.body ?? {};
    const group = await leagueGroupService.createLeagueGroup(getCurrentUserId(), name);
    res.status(201).json(group);
  }),
);

leagueGroupsRouter.patch(
  "/league-groups/:id",
  asyncHandler(async (req, res) => {
    const { name } = req.body ?? {};
    const group = await leagueGroupService.renameLeagueGroup(getCurrentUserId(), req.params.id, name);
    res.json(group);
  }),
);

leagueGroupsRouter.delete(
  "/league-groups/:id",
  asyncHandler(async (req, res) => {
    await leagueGroupService.deleteLeagueGroup(getCurrentUserId(), req.params.id);
    res.status(204).send();
  }),
);

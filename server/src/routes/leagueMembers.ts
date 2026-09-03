import { Router } from "express";

import { getCurrentUserId } from "../currentUser.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import * as leagueMemberService from "../services/leagueMemberService.js";

export const leagueMembersRouter = Router();

leagueMembersRouter.get(
  "/leagues/:leagueId/members",
  asyncHandler(async (req, res) => {
    const members = await leagueMemberService.listLeagueMembers(getCurrentUserId(), req.params.leagueId);
    res.json(members);
  }),
);

leagueMembersRouter.post(
  "/leagues/:leagueId/members",
  asyncHandler(async (req, res) => {
    const { teamName, externalDisplayName } = req.body ?? {};
    const member = await leagueMemberService.createLeagueMember(getCurrentUserId(), req.params.leagueId, {
      teamName,
      externalDisplayName,
    });
    res.status(201).json(member);
  }),
);

leagueMembersRouter.patch(
  "/league-members/:id",
  asyncHandler(async (req, res) => {
    const { teamName, externalDisplayName } = req.body ?? {};
    const member = await leagueMemberService.updateLeagueMember(getCurrentUserId(), req.params.id, {
      teamName,
      externalDisplayName,
    });
    res.json(member);
  }),
);

leagueMembersRouter.delete(
  "/league-members/:id",
  asyncHandler(async (req, res) => {
    await leagueMemberService.deleteLeagueMember(getCurrentUserId(), req.params.id);
    res.status(204).send();
  }),
);

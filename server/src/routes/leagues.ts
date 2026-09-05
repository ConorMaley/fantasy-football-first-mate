import { Router } from "express";

import { getCurrentUserId } from "../currentUser.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { assertLeagueAccess } from "../lib/leagueAccess.js";
import {
  getLeagueMatchupsForWeek,
  getLeagueStandings,
  getLeagueTeams,
  getLeagueTransactions,
  getMatchupBoxScore,
  getTeamRoster,
} from "../lib/leagueQueries.js";
import * as leagueGroupService from "../services/leagueGroupService.js";
import * as leagueService from "../services/leagueService.js";

export const leaguesRouter = Router();

// -- Admin CRUD (owner-only; see leagueService.getOwnedLeague) --------------

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

// -- Dashboard / league-detail reads (creator OR matched member; see
// leagueAccess.assertLeagueAccess) ------------------------------------------

leaguesRouter.get(
  "/leagues/:leagueId",
  asyncHandler(async (req, res) => {
    const league = await assertLeagueAccess(getCurrentUserId(), req.params.leagueId);
    res.json({
      id: league.id,
      name: league.name,
      platform: league.platform,
      season: league.season,
    });
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/standings",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(getCurrentUserId(), req.params.leagueId);
    const standings = await getLeagueStandings(req.params.leagueId);
    res.json({ standings });
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/matchups",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(getCurrentUserId(), req.params.leagueId);

    const weekParam = req.query.week;
    let requestedWeek: number | undefined;
    if (typeof weekParam === "string" && weekParam.trim() !== "") {
      requestedWeek = Number(weekParam);
      if (!Number.isInteger(requestedWeek)) {
        res.status(400).json({ error: "week must be an integer" });
        return;
      }
    }

    const result = await getLeagueMatchupsForWeek(req.params.leagueId, requestedWeek);
    res.json(result);
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/matchups/:matchupId",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(getCurrentUserId(), req.params.leagueId);
    const boxScore = await getMatchupBoxScore(req.params.leagueId, req.params.matchupId);
    res.json(boxScore);
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/rosters",
  asyncHandler(async (req, res) => {
    const userId = getCurrentUserId();
    await assertLeagueAccess(userId, req.params.leagueId);
    const teams = await getLeagueTeams(req.params.leagueId, userId);
    res.json({ teams });
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/rosters/:teamId",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(getCurrentUserId(), req.params.leagueId);
    const roster = await getTeamRoster(req.params.leagueId, req.params.teamId);
    res.json(roster);
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/transactions",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(getCurrentUserId(), req.params.leagueId);
    const transactions = await getLeagueTransactions(req.params.leagueId);
    res.json({ transactions });
  }),
);

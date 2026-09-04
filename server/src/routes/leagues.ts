import { Router } from "express";

import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/errors.js";
import { assertLeagueAccess } from "../lib/leagueAccess.js";
import {
  getLeagueMatchupsForWeek,
  getLeagueStandings,
  getLeagueTeams,
  getLeagueTransactions,
  getMatchupBoxScore,
  getTeamRoster,
} from "../lib/leagueQueries.js";

export const leaguesRouter = Router();

leaguesRouter.get(
  "/leagues/:leagueId",
  asyncHandler(async (req, res) => {
    const league = await assertLeagueAccess(req.currentUserId, req.params.leagueId);
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
    await assertLeagueAccess(req.currentUserId, req.params.leagueId);
    const standings = await getLeagueStandings(req.params.leagueId);
    res.json({ standings });
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/matchups",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(req.currentUserId, req.params.leagueId);

    const weekParam = req.query.week;
    let requestedWeek: number | undefined;
    if (typeof weekParam === "string" && weekParam.trim() !== "") {
      requestedWeek = Number(weekParam);
      if (!Number.isInteger(requestedWeek)) {
        throw new HttpError(400, "week must be an integer");
      }
    }

    const result = await getLeagueMatchupsForWeek(req.params.leagueId, requestedWeek);
    res.json(result);
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/matchups/:matchupId",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(req.currentUserId, req.params.leagueId);
    const boxScore = await getMatchupBoxScore(req.params.leagueId, req.params.matchupId);
    res.json(boxScore);
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/rosters",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(req.currentUserId, req.params.leagueId);
    const teams = await getLeagueTeams(req.params.leagueId, req.currentUserId);
    res.json({ teams });
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/rosters/:teamId",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(req.currentUserId, req.params.leagueId);
    const roster = await getTeamRoster(req.params.leagueId, req.params.teamId);
    res.json(roster);
  }),
);

leaguesRouter.get(
  "/leagues/:leagueId/transactions",
  asyncHandler(async (req, res) => {
    await assertLeagueAccess(req.currentUserId, req.params.leagueId);
    const transactions = await getLeagueTransactions(req.params.leagueId);
    res.json({ transactions });
  }),
);

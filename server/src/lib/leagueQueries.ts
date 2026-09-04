import type { Prisma } from "@prisma/client";

import { NotFoundError } from "./errors.js";
import { prisma } from "./prisma.js";

export interface StandingRow {
  leagueMemberId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number | null;
  streak: string | null;
}

type StandingWithMember = Prisma.StandingGetPayload<{ include: { leagueMember: true } }>;

export function shapeStandingRow(s: StandingWithMember): StandingRow {
  return {
    leagueMemberId: s.leagueMemberId,
    teamName: s.leagueMember.teamName,
    externalDisplayName: s.leagueMember.externalDisplayName,
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    pointsFor: s.pointsFor,
    pointsAgainst: s.pointsAgainst,
    rank: s.rank,
    streak: s.streak,
  };
}

export async function getLeagueStandings(leagueId: string): Promise<StandingRow[]> {
  const standings = await prisma.standing.findMany({
    where: { leagueMember: { leagueId } },
    include: { leagueMember: true },
    orderBy: { rank: "asc" },
  });
  return standings.map(shapeStandingRow);
}

export interface MatchupSide {
  leagueMemberId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  score: number | null;
  projectedScore: number | null;
}

export interface MatchupSummary {
  id: string;
  sides: MatchupSide[];
}

type MatchupWithSides = Prisma.MatchupGetPayload<{
  include: { rosterMatchups: { include: { leagueMember: true } } };
}>;

export function shapeMatchup(m: MatchupWithSides): MatchupSummary {
  return {
    id: m.id,
    sides: m.rosterMatchups.map((rm) => ({
      leagueMemberId: rm.leagueMemberId,
      teamName: rm.leagueMember.teamName,
      externalDisplayName: rm.leagueMember.externalDisplayName,
      score: rm.score,
      projectedScore: rm.projectedScore,
    })),
  };
}

export interface LeagueMatchupsForWeek {
  week: number | null;
  availableWeeks: number[];
  matchups: MatchupSummary[];
}

/**
 * Matchups for one week of a league, defaulting to the latest week with
 * data when no week is requested. Also returns every week that has data so
 * the client can build a prev/next selector without guessing bounds.
 */
export async function getLeagueMatchupsForWeek(
  leagueId: string,
  requestedWeek?: number,
): Promise<LeagueMatchupsForWeek> {
  const weekRows = await prisma.matchup.findMany({
    where: { leagueId },
    select: { week: true },
    distinct: ["week"],
    orderBy: { week: "asc" },
  });
  const availableWeeks = weekRows.map((r) => r.week);
  if (availableWeeks.length === 0) {
    return { week: null, availableWeeks: [], matchups: [] };
  }
  const week = requestedWeek ?? availableWeeks[availableWeeks.length - 1];

  const matchups = await prisma.matchup.findMany({
    where: { leagueId, week },
    include: { rosterMatchups: { include: { leagueMember: true } } },
  });

  return { week, availableWeeks, matchups: matchups.map(shapeMatchup) };
}

export interface BoxScorePlayer {
  playerId: string;
  fullName: string;
  position: string;
  nflTeam: string | null;
  lineupSlot: string;
  points: number | null;
  projectedPoints: number | null;
}

export interface BoxScoreSide {
  leagueMemberId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  score: number | null;
  projectedScore: number | null;
  starters: BoxScorePlayer[];
  bench: BoxScorePlayer[];
}

export interface BoxScore {
  id: string;
  week: number;
  sides: BoxScoreSide[];
}

function shapeBoxScorePlayer(slot: {
  playerId: string;
  lineupSlot: string;
  points: number | null;
  projectedPoints: number | null;
  player: { fullName: string; position: string; nflTeam: string | null };
}): BoxScorePlayer {
  return {
    playerId: slot.playerId,
    fullName: slot.player.fullName,
    position: slot.player.position,
    nflTeam: slot.player.nflTeam,
    lineupSlot: slot.lineupSlot,
    points: slot.points,
    projectedPoints: slot.projectedPoints,
  };
}

/**
 * Full detail for one matchup: each side's starters and bench, split
 * server-side by isStarter rather than left for the client to infer.
 */
export async function getMatchupBoxScore(leagueId: string, matchupId: string): Promise<BoxScore> {
  const matchup = await prisma.matchup.findFirst({
    where: { id: matchupId, leagueId },
    include: {
      rosterMatchups: {
        include: {
          leagueMember: true,
          slots: { include: { player: true } },
        },
      },
    },
  });
  if (!matchup) {
    throw new NotFoundError("Matchup not found");
  }

  return {
    id: matchup.id,
    week: matchup.week,
    sides: matchup.rosterMatchups.map((rm) => ({
      leagueMemberId: rm.leagueMemberId,
      teamName: rm.leagueMember.teamName,
      externalDisplayName: rm.leagueMember.externalDisplayName,
      score: rm.score,
      projectedScore: rm.projectedScore,
      starters: rm.slots.filter((s) => s.isStarter).map(shapeBoxScorePlayer),
      bench: rm.slots.filter((s) => !s.isStarter).map(shapeBoxScorePlayer),
    })),
  };
}

export interface TeamSummary {
  teamId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  isCurrentUser: boolean;
}

/** Every team in the league, flagged so the client can default-select the
 * current user's own team without a second lookup. */
export async function getLeagueTeams(leagueId: string, currentUserId: string): Promise<TeamSummary[]> {
  const members = await prisma.leagueMember.findMany({
    where: { leagueId },
    orderBy: { createdAt: "asc" },
  });
  return members.map((m) => ({
    teamId: m.teamId,
    teamName: m.teamName,
    externalDisplayName: m.externalDisplayName,
    isCurrentUser: m.userId === currentUserId,
  }));
}

export interface RosterPlayer {
  playerId: string;
  fullName: string;
  position: string;
  nflTeam: string | null;
  lineupSlot: string;
}

export interface TeamRoster {
  teamId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  starters: RosterPlayer[];
  bench: RosterPlayer[];
}

function shapeRosterPlayer(slot: {
  playerId: string;
  lineupSlot: string;
  player: { fullName: string; position: string; nflTeam: string | null };
}): RosterPlayer {
  return {
    playerId: slot.playerId,
    fullName: slot.player.fullName,
    position: slot.player.position,
    nflTeam: slot.player.nflTeam,
    lineupSlot: slot.lineupSlot,
  };
}

/** :teamId here is LeagueMember.teamId (the natural external-facing team
 * identifier), not LeagueMember.id. */
export async function getTeamRoster(leagueId: string, teamId: string): Promise<TeamRoster> {
  const member = await prisma.leagueMember.findFirst({
    where: { leagueId, teamId },
    include: { roster: { include: { slots: { include: { player: true } } } } },
  });
  if (!member) {
    throw new NotFoundError("Team not found");
  }
  if (!member.roster) {
    throw new NotFoundError("Roster not found");
  }

  return {
    teamId: member.teamId,
    teamName: member.teamName,
    externalDisplayName: member.externalDisplayName,
    starters: member.roster.slots.filter((s) => s.isStarter).map(shapeRosterPlayer),
    bench: member.roster.slots.filter((s) => !s.isStarter).map(shapeRosterPlayer),
  };
}

export interface TransactionItemSummary {
  action: string;
  player: { fullName: string; position: string };
  team: { teamId: string; teamName: string | null; externalDisplayName: string | null } | null;
}

export interface TransactionSummary {
  id: string;
  type: string;
  processedAt: string | null;
  items: TransactionItemSummary[];
}

/** Reverse-chronological (processedAt, falling back to createdAt for any
 * unprocessed row) feed of every transaction in the league. A null `team`
 * on an item represents free agency, not a data error. */
export async function getLeagueTransactions(leagueId: string): Promise<TransactionSummary[]> {
  const transactions = await prisma.transaction.findMany({
    where: { leagueId },
    include: { items: { include: { player: true, leagueMember: true } } },
  });

  const sorted = [...transactions].sort((a, b) => {
    const aTime = (a.processedAt ?? a.createdAt).getTime();
    const bTime = (b.processedAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  return sorted.map((t) => ({
    id: t.id,
    type: t.type,
    processedAt: t.processedAt ? t.processedAt.toISOString() : null,
    items: t.items.map((item) => ({
      action: item.action,
      player: { fullName: item.player.fullName, position: item.player.position },
      team: item.leagueMember
        ? {
            teamId: item.leagueMember.teamId,
            teamName: item.leagueMember.teamName,
            externalDisplayName: item.leagueMember.externalDisplayName,
          }
        : null,
    })),
  }));
}

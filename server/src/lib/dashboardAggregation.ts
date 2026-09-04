import type { Platform } from "@prisma/client";

import { findVisibleLeagues } from "./leagueAccess.js";
import { shapeMatchup, shapeStandingRow, type MatchupSummary, type StandingRow } from "./leagueQueries.js";
import { prisma } from "./prisma.js";

export interface DashboardLeague {
  id: string;
  name: string;
  platform: Platform;
  season: number;
  latestWeek: number | null;
  matchups: MatchupSummary[];
  standings: StandingRow[];
}

export interface DashboardResult {
  leagues: DashboardLeague[];
}

/**
 * For every league visible to the user: its latest week (the highest
 * Matchup.week on record — there's no calendar/current-NFL-week concept),
 * that week's full matchup list (every pairing, all sides), and the
 * league's full standings table. One aggregate query set so the dashboard
 * loads in a single request.
 */
export async function buildDashboard(userId: string): Promise<DashboardResult> {
  const leagues = await findVisibleLeagues(userId);
  if (leagues.length === 0) {
    return { leagues: [] };
  }
  const leagueIds = leagues.map((l) => l.id);

  const latestWeekRows = await prisma.matchup.groupBy({
    by: ["leagueId"],
    where: { leagueId: { in: leagueIds } },
    _max: { week: true },
  });
  const latestWeekByLeague = new Map(latestWeekRows.map((r) => [r.leagueId, r._max.week]));

  const latestWeekMatchupFilters = leagues
    .map((l) => ({ leagueId: l.id, week: latestWeekByLeague.get(l.id) }))
    .filter((c): c is { leagueId: string; week: number } => c.week != null);

  const matchups = latestWeekMatchupFilters.length
    ? await prisma.matchup.findMany({
        where: { OR: latestWeekMatchupFilters },
        include: { rosterMatchups: { include: { leagueMember: true } } },
      })
    : [];

  const matchupsByLeague = new Map<string, MatchupSummary[]>();
  for (const m of matchups) {
    const list = matchupsByLeague.get(m.leagueId) ?? [];
    list.push(shapeMatchup(m));
    matchupsByLeague.set(m.leagueId, list);
  }

  const standings = await prisma.standing.findMany({
    where: { leagueMember: { leagueId: { in: leagueIds } } },
    include: { leagueMember: true },
    orderBy: { rank: "asc" },
  });
  const standingsByLeague = new Map<string, StandingRow[]>();
  for (const s of standings) {
    const list = standingsByLeague.get(s.leagueMember.leagueId) ?? [];
    list.push(shapeStandingRow(s));
    standingsByLeague.set(s.leagueMember.leagueId, list);
  }

  return {
    leagues: leagues.map((l) => ({
      id: l.id,
      name: l.name,
      platform: l.platform,
      season: l.season,
      latestWeek: latestWeekByLeague.get(l.id) ?? null,
      matchups: matchupsByLeague.get(l.id) ?? [],
      standings: standingsByLeague.get(l.id) ?? [],
    })),
  };
}

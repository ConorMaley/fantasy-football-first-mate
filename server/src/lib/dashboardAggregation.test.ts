import { describe, expect, it } from "vitest";

import { buildDashboard } from "./dashboardAggregation.js";
import { prisma } from "./prisma.js";
import { ALEX_EMAIL, LEAGUE_A_NAME, LEAGUE_B_NAME, WEEK_COUNT } from "../../prisma/seed.js";

async function alexUserId(): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: ALEX_EMAIL } });
  return user.id;
}

describe("buildDashboard", () => {
  it("returns only the leagues visible to the user (composes findVisibleLeagues)", async () => {
    const result = await buildDashboard(await alexUserId());
    expect(result.leagues.map((l) => l.name).sort()).toEqual([LEAGUE_B_NAME, LEAGUE_A_NAME].sort());
  });

  it("reports each league's latest week as the seeded max week", async () => {
    const result = await buildDashboard(await alexUserId());
    for (const league of result.leagues) {
      expect(league.latestWeek).toBe(WEEK_COUNT);
    }
  });

  it("includes a complete matchup list for the latest week, every side scored", async () => {
    const result = await buildDashboard(await alexUserId());
    const leagueA = result.leagues.find((l) => l.name === LEAGUE_A_NAME)!;
    const memberCount = await prisma.leagueMember.count({ where: { league: { name: LEAGUE_A_NAME } } });

    expect(leagueA.matchups.length).toBe(memberCount / 2);
    for (const matchup of leagueA.matchups) {
      expect(matchup.sides.length).toBe(2);
      for (const side of matchup.sides) {
        expect(typeof side.score).toBe("number");
      }
    }
  });

  it("includes a full standings table, sorted by rank ascending starting at 1", async () => {
    const result = await buildDashboard(await alexUserId());
    const leagueB = result.leagues.find((l) => l.name === LEAGUE_B_NAME)!;
    const memberCount = await prisma.leagueMember.count({ where: { league: { name: LEAGUE_B_NAME } } });

    expect(leagueB.standings.length).toBe(memberCount);
    expect(leagueB.standings.map((s) => s.rank)).toEqual(
      Array.from({ length: memberCount }, (_, i) => i + 1),
    );
  });

  it("standings are internally consistent with the seeded matchup results", async () => {
    const result = await buildDashboard(await alexUserId());
    const leagueA = result.leagues.find((l) => l.name === LEAGUE_A_NAME)!;
    for (const row of leagueA.standings) {
      expect(row.wins + row.losses + row.ties).toBe(WEEK_COUNT);
    }
  });
});

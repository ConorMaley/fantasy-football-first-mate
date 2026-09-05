import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { authHeaderFor } from "../test/helpers.js";
import {
  ALEX_EMAIL,
  BENCH_COUNT,
  LEAGUE_A_NAME,
  LEAGUE_B_NAME,
  LEAGUE_C_NAME,
  STARTER_COUNT,
  WEEK_COUNT,
} from "../../prisma/seed.js";

let authHeader: string;

beforeAll(async () => {
  const alex = await prisma.user.findUniqueOrThrow({ where: { email: ALEX_EMAIL } });
  authHeader = await authHeaderFor(alex.id);
});

describe("GET /api/leagues/:leagueId", () => {
  it("returns the league summary for a league visible to the current user", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}`).set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: league.id, name: LEAGUE_A_NAME, platform: "ESPN", season: 2025 });
  });

  it("returns 404 for an inactive league", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_C_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}`).set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a league id that doesn't exist", async () => {
    const res = await request(app).get("/api/leagues/does-not-exist").set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/leagues/:leagueId/standings", () => {
  it("returns the full standings table, matching the dashboard's standings for the same league", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const memberCount = await prisma.leagueMember.count({ where: { leagueId: league.id } });

    const res = await request(app).get(`/api/leagues/${league.id}/standings`).set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body.standings).toHaveLength(memberCount);
    expect((res.body.standings as Array<{ rank: number }>).map((s) => s.rank)).toEqual(
      Array.from({ length: memberCount }, (_, i) => i + 1),
    );
  });

  it("returns 404 for a league the user can't see", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_C_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/standings`).set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/leagues/:leagueId/matchups", () => {
  it("defaults to the latest week when none is requested", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const memberCount = await prisma.leagueMember.count({ where: { leagueId: league.id } });

    const res = await request(app).get(`/api/leagues/${league.id}/matchups`).set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body.week).toBe(WEEK_COUNT);
    expect(res.body.availableWeeks).toEqual(Array.from({ length: WEEK_COUNT }, (_, i) => i + 1));
    expect(res.body.matchups).toHaveLength(memberCount / 2);
  });

  it("returns matchups for an explicit earlier week", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const memberCount = await prisma.leagueMember.count({ where: { leagueId: league.id } });

    const res = await request(app).get(`/api/leagues/${league.id}/matchups?week=2`).set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body.week).toBe(2);
    expect(res.body.matchups).toHaveLength(memberCount / 2);
    for (const matchup of res.body.matchups as Array<{ sides: unknown[] }>) {
      expect(matchup.sides).toHaveLength(2);
    }
  });

  it("returns 404 for a league the user can't see", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_C_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/matchups`).set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/leagues/:leagueId/matchups/:matchupId", () => {
  it("returns a box score with starters matching the seeded lineup size, disjoint from bench", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const matchup = await prisma.matchup.findFirstOrThrow({ where: { leagueId: league.id } });

    const res = await request(app).get(`/api/leagues/${league.id}/matchups/${matchup.id}`).set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body.sides).toHaveLength(2);

    for (const side of res.body.sides as Array<{ starters: Array<{ playerId: string }>; bench: Array<{ playerId: string }> }>) {
      expect(side.starters).toHaveLength(STARTER_COUNT);
      expect(side.bench).toHaveLength(BENCH_COUNT);
      const starterIds = new Set(side.starters.map((p) => p.playerId));
      const benchIds = new Set(side.bench.map((p) => p.playerId));
      expect([...starterIds].some((id) => benchIds.has(id))).toBe(false);
    }
  });

  it("returns 404 for a matchup that belongs to a different league", async () => {
    const leagueA = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const otherMatchup = await prisma.matchup.findFirstOrThrow({ where: { leagueId: { not: leagueA.id } } });

    const res = await request(app).get(`/api/leagues/${leagueA.id}/matchups/${otherMatchup.id}`).set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a league the user can't see", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_C_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/matchups/does-not-exist`).set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/leagues/:leagueId/rosters", () => {
  it("lists every team in the league", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const memberCount = await prisma.leagueMember.count({ where: { leagueId: league.id } });

    const res = await request(app).get(`/api/leagues/${league.id}/rosters`).set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body.teams).toHaveLength(memberCount);
  });

  it("flags exactly the current user's own team", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_B_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/rosters`).set("Authorization", authHeader);
    const flagged = (res.body.teams as Array<{ teamId: string; isCurrentUser: boolean }>).filter(
      (t) => t.isCurrentUser,
    );
    expect(flagged).toHaveLength(1);
    expect(flagged[0].teamId).toBe("team-1");
  });

  it("returns 404 for a league the user can't see", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_C_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/rosters`).set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/leagues/:leagueId/rosters/:teamId", () => {
  it("returns a team's starters and bench grouped by lineup slot", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/rosters/team-1`).set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body.starters).toHaveLength(STARTER_COUNT);
    expect(res.body.bench).toHaveLength(BENCH_COUNT);
  });

  it("returns 404 for a team id that doesn't exist in the league", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/rosters/does-not-exist`).set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a league the user can't see", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_C_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/rosters/team-1`).set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/leagues/:leagueId/transactions", () => {
  it("returns every seeded transaction for the league, newest first", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const expectedCount = await prisma.transaction.count({ where: { leagueId: league.id } });

    const res = await request(app).get(`/api/leagues/${league.id}/transactions`).set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(expectedCount);

    const timestamps = (res.body.transactions as Array<{ processedAt: string | null }>).map((t) =>
      t.processedAt ? new Date(t.processedAt).getTime() : 0,
    );
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });

  it("renders a multi-item trade as one transaction spanning two teams", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/transactions`).set("Authorization", authHeader);
    const trade = (res.body.transactions as Array<{ type: string; items: Array<{ team: { teamId: string } | null }> }>).find(
      (t) => t.type === "TRADE",
    );
    expect(trade).toBeDefined();
    expect(trade!.items).toHaveLength(4);
    const teamIds = new Set(trade!.items.map((i) => i.team?.teamId).filter(Boolean));
    expect(teamIds.size).toBe(2);
  });

  it("renders a free-agent drop (no receiving team) without error", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/transactions`).set("Authorization", authHeader);
    const freeAgentItem = (res.body.transactions as Array<{ items: Array<{ team: unknown }> }>)
      .flatMap((t) => t.items)
      .find((i) => i.team === null);
    expect(freeAgentItem).toBeDefined();
  });

  it("returns 404 for a league the user can't see", async () => {
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_C_NAME } });
    const res = await request(app).get(`/api/leagues/${league.id}/transactions`).set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });
});

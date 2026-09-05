import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError } from "./errors.js";
import * as leagueService from "./leagueService.js";

describe("leagueService", () => {
  let userId: string;
  let otherUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `league-${randomUUID()}@test.local`, displayName: "League Test User" },
    });
    userId = user.id;

    const other = await prisma.user.create({
      data: { email: `league-other-${randomUUID()}@test.local`, displayName: "League Other User" },
    });
    otherUserId = other.id;
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { createdById: { in: [userId, otherUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  });

  it("creates and lists a league scoped to the user", async () => {
    const league = await leagueService.createLeague(userId, {
      platform: "ESPN",
      externalLeagueId: "111",
      name: "Test League",
      season: 2024,
    });
    expect(league.createdById).toBe(userId);

    const leagues = await leagueService.listLeagues(userId);
    expect(leagues.map((l) => l.id)).toContain(league.id);
  });

  it("rejects a duplicate platform/externalLeagueId/season for the same user", async () => {
    await leagueService.createLeague(userId, {
      platform: "SLEEPER",
      externalLeagueId: "222",
      name: "Dup League",
      season: 2024,
    });

    await expect(
      leagueService.createLeague(userId, {
        platform: "SLEEPER",
        externalLeagueId: "222",
        name: "Dup League Again",
        season: 2024,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("only lets the owning user read, update, or delete their league", async () => {
    const league = await leagueService.createLeague(userId, {
      platform: "YAHOO",
      externalLeagueId: "333",
      name: "Owned League",
      season: 2025,
    });

    await expect(leagueService.updateLeague(otherUserId, league.id, { name: "Hijacked" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(leagueService.deleteLeague(otherUserId, league.id)).rejects.toBeInstanceOf(NotFoundError);

    const updated = await leagueService.updateLeague(userId, league.id, { name: "Renamed" });
    expect(updated.name).toBe("Renamed");

    await leagueService.deleteLeague(userId, league.id);
    await expect(leagueService.getOwnedLeague(userId, league.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

import { describe, expect, it } from "vitest";

import { DEV_USER_EMAIL } from "./devUser.js";
import { assertLeagueAccess, findVisibleLeagues } from "./leagueAccess.js";
import { prisma } from "./prisma.js";
import { LEAGUE_A_NAME, LEAGUE_B_NAME, LEAGUE_C_NAME, SEEDMATE_USER_EMAIL } from "../../prisma/seed.js";

describe("findVisibleLeagues", () => {
  it("returns exactly the leagues the dev user created or is matched into, excluding inactive ones", async () => {
    const devUser = await prisma.user.findUniqueOrThrow({ where: { email: DEV_USER_EMAIL } });
    const leagues = await findVisibleLeagues(devUser.id);
    expect(leagues.map((l) => l.name).sort()).toEqual([LEAGUE_B_NAME, LEAGUE_A_NAME].sort());
  });

  it("includes a league via the creator branch", async () => {
    const devUser = await prisma.user.findUniqueOrThrow({ where: { email: DEV_USER_EMAIL } });
    const leagues = await findVisibleLeagues(devUser.id);
    const created = leagues.find((l) => l.name === LEAGUE_A_NAME);
    expect(created?.createdById).toBe(devUser.id);
  });

  it("includes a league via the matched-member branch even when not the creator", async () => {
    const devUser = await prisma.user.findUniqueOrThrow({ where: { email: DEV_USER_EMAIL } });
    const leagues = await findVisibleLeagues(devUser.id);
    const matched = leagues.find((l) => l.name === LEAGUE_B_NAME);
    expect(matched).toBeDefined();
    expect(matched?.createdById).not.toBe(devUser.id);
  });

  it("excludes an inactive league even when the user created it", async () => {
    const devUser = await prisma.user.findUniqueOrThrow({ where: { email: DEV_USER_EMAIL } });
    const leagues = await findVisibleLeagues(devUser.id);
    expect(leagues.some((l) => l.name === LEAGUE_C_NAME)).toBe(false);
  });

  it("excludes a league the user has no relationship to", async () => {
    const seedmate = await prisma.user.findUniqueOrThrow({ where: { email: SEEDMATE_USER_EMAIL } });
    const leagues = await findVisibleLeagues(seedmate.id);
    expect(leagues.some((l) => l.name === LEAGUE_A_NAME)).toBe(false);
  });
});

describe("assertLeagueAccess", () => {
  it("resolves a league visible to the user", async () => {
    const devUser = await prisma.user.findUniqueOrThrow({ where: { email: DEV_USER_EMAIL } });
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    await expect(assertLeagueAccess(devUser.id, league.id)).resolves.toMatchObject({ id: league.id });
  });

  it("throws not-found for an inactive league", async () => {
    const devUser = await prisma.user.findUniqueOrThrow({ where: { email: DEV_USER_EMAIL } });
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_C_NAME } });
    await expect(assertLeagueAccess(devUser.id, league.id)).rejects.toThrow();
  });

  it("throws not-found for a league the user has no relationship to", async () => {
    const seedmate = await prisma.user.findUniqueOrThrow({ where: { email: SEEDMATE_USER_EMAIL } });
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    await expect(assertLeagueAccess(seedmate.id, league.id)).rejects.toThrow();
  });
});

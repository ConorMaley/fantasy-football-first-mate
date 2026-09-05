import { describe, expect, it } from "vitest";

import { assertLeagueAccess, findVisibleLeagues } from "./leagueAccess.js";
import { prisma } from "./prisma.js";
import { ALEX_EMAIL, JORDAN_EMAIL, LEAGUE_A_NAME, LEAGUE_B_NAME, LEAGUE_C_NAME } from "../../prisma/seed.js";

describe("findVisibleLeagues", () => {
  it("returns exactly the leagues the dev user created or is matched into, excluding inactive ones", async () => {
    const alex = await prisma.user.findUniqueOrThrow({ where: { email: ALEX_EMAIL } });
    const leagues = await findVisibleLeagues(alex.id);
    expect(leagues.map((l) => l.name).sort()).toEqual([LEAGUE_B_NAME, LEAGUE_A_NAME].sort());
  });

  it("includes a league via the creator branch", async () => {
    const alex = await prisma.user.findUniqueOrThrow({ where: { email: ALEX_EMAIL } });
    const leagues = await findVisibleLeagues(alex.id);
    const created = leagues.find((l) => l.name === LEAGUE_A_NAME);
    expect(created?.createdById).toBe(alex.id);
  });

  it("includes a league via the matched-member branch even when not the creator", async () => {
    const alex = await prisma.user.findUniqueOrThrow({ where: { email: ALEX_EMAIL } });
    const leagues = await findVisibleLeagues(alex.id);
    const matched = leagues.find((l) => l.name === LEAGUE_B_NAME);
    expect(matched).toBeDefined();
    expect(matched?.createdById).not.toBe(alex.id);
  });

  it("excludes an inactive league even when the user created it", async () => {
    const alex = await prisma.user.findUniqueOrThrow({ where: { email: ALEX_EMAIL } });
    const leagues = await findVisibleLeagues(alex.id);
    expect(leagues.some((l) => l.name === LEAGUE_C_NAME)).toBe(false);
  });

  it("excludes a league the user has no relationship to", async () => {
    const jordan = await prisma.user.findUniqueOrThrow({ where: { email: JORDAN_EMAIL } });
    const leagues = await findVisibleLeagues(jordan.id);
    expect(leagues.some((l) => l.name === LEAGUE_A_NAME)).toBe(false);
  });
});

describe("assertLeagueAccess", () => {
  it("resolves a league visible to the user", async () => {
    const alex = await prisma.user.findUniqueOrThrow({ where: { email: ALEX_EMAIL } });
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    await expect(assertLeagueAccess(alex.id, league.id)).resolves.toMatchObject({ id: league.id });
  });

  it("throws not-found for an inactive league", async () => {
    const alex = await prisma.user.findUniqueOrThrow({ where: { email: ALEX_EMAIL } });
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_C_NAME } });
    await expect(assertLeagueAccess(alex.id, league.id)).rejects.toThrow();
  });

  it("throws not-found for a league the user has no relationship to", async () => {
    const jordan = await prisma.user.findUniqueOrThrow({ where: { email: JORDAN_EMAIL } });
    const league = await prisma.league.findFirstOrThrow({ where: { name: LEAGUE_A_NAME } });
    await expect(assertLeagueAccess(jordan.id, league.id)).rejects.toThrow();
  });
});

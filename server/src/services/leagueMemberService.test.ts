import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "./errors.js";
import * as leagueMemberService from "./leagueMemberService.js";
import * as leagueService from "./leagueService.js";

describe("leagueMemberService", () => {
  let userId: string;
  let otherUserId: string;
  let leagueId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `member-${randomUUID()}@test.local`, displayName: "Member Test User" },
    });
    userId = user.id;

    const other = await prisma.user.create({
      data: { email: `member-other-${randomUUID()}@test.local`, displayName: "Member Other User" },
    });
    otherUserId = other.id;

    const league = await leagueService.createLeague(userId, {
      platform: "SLEEPER",
      externalLeagueId: "555",
      name: "League With Members",
      season: 2024,
    });
    leagueId = league.id;
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { createdById: { in: [userId, otherUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  });

  it("creates a member with an auto-generated unique teamId", async () => {
    const member = await leagueMemberService.createLeagueMember(userId, leagueId, {
      teamName: "Team Chaos",
      externalDisplayName: "Bob",
    });
    expect(member.teamId).toBeTruthy();

    const other = await leagueMemberService.createLeagueMember(userId, leagueId, {
      teamName: "Team Havoc",
      externalDisplayName: "Sam",
    });
    expect(other.teamId).not.toBe(member.teamId);
  });

  it("rejects creating a member against a league you don't own", async () => {
    await expect(
      leagueMemberService.createLeagueMember(otherUserId, leagueId, { teamName: "Intruder" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("scopes update and delete to the owning user", async () => {
    const member = await leagueMemberService.createLeagueMember(userId, leagueId, {
      teamName: "Team Scoped",
    });

    await expect(
      leagueMemberService.updateLeagueMember(otherUserId, member.id, { teamName: "Hijacked" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const updated = await leagueMemberService.updateLeagueMember(userId, member.id, { teamName: "Renamed" });
    expect(updated.teamName).toBe("Renamed");

    await leagueMemberService.deleteLeagueMember(userId, member.id);
    await expect(leagueMemberService.getOwnedLeagueMember(userId, member.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

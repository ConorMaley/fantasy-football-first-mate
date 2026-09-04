import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "./errors.js";
import * as leagueGroupService from "./leagueGroupService.js";
import * as leagueService from "./leagueService.js";

describe("leagueGroupService", () => {
  let userId: string;
  let otherUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `group-${randomUUID()}@test.local`, displayName: "Group Test User" },
    });
    userId = user.id;

    const other = await prisma.user.create({
      data: { email: `group-other-${randomUUID()}@test.local`, displayName: "Group Other User" },
    });
    otherUserId = other.id;
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { createdById: { in: [userId, otherUserId] } } });
    await prisma.leagueGroup.deleteMany({ where: { ownerId: { in: [userId, otherUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  });

  it("creates, renames, and deletes a group scoped to its owner", async () => {
    const group = await leagueGroupService.createLeagueGroup(userId, "My Dynasty");
    expect(group.ownerId).toBe(userId);

    const renamed = await leagueGroupService.renameLeagueGroup(userId, group.id, "Renamed Dynasty");
    expect(renamed.name).toBe("Renamed Dynasty");

    await expect(leagueGroupService.renameLeagueGroup(otherUserId, group.id, "Hijacked")).rejects.toBeInstanceOf(
      NotFoundError,
    );

    await leagueGroupService.deleteLeagueGroup(userId, group.id);
    await expect(leagueGroupService.getOwnedLeagueGroup(userId, group.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("assigns and clears a league's group, rejecting cross-owner assignment", async () => {
    const league = await leagueService.createLeague(userId, {
      platform: "ESPN",
      externalLeagueId: "444",
      name: "Groupable League",
      season: 2024,
    });
    const group = await leagueGroupService.createLeagueGroup(userId, "Owner Group");
    const otherGroup = await leagueGroupService.createLeagueGroup(otherUserId, "Other Owner Group");

    await expect(
      leagueGroupService.assignLeagueToGroup(userId, league.id, otherGroup.id),
    ).rejects.toBeInstanceOf(NotFoundError);

    const assigned = await leagueGroupService.assignLeagueToGroup(userId, league.id, group.id);
    expect(assigned.leagueGroupId).toBe(group.id);

    const cleared = await leagueGroupService.clearLeagueGroup(userId, league.id);
    expect(cleared.leagueGroupId).toBeNull();
  });
});

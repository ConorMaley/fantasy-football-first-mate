import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import * as crewmateService from "./crewmateService.js";
import * as crewmateTaggingService from "./crewmateTaggingService.js";
import { ConflictError, NotFoundError } from "./errors.js";
import * as leagueMemberService from "./leagueMemberService.js";
import * as leagueService from "./leagueService.js";

describe("crewmateTaggingService", () => {
  let ownerId: string;
  let otherOwnerId: string;
  let leagueMemberId: string;
  let otherOwnersLeagueMemberId: string;
  let crewmateId: string;

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: { email: `tag-${randomUUID()}@test.local`, displayName: "Tag Owner" },
    });
    ownerId = owner.id;

    const otherOwner = await prisma.user.create({
      data: { email: `tag-other-${randomUUID()}@test.local`, displayName: "Tag Other Owner" },
    });
    otherOwnerId = otherOwner.id;

    const league = await leagueService.createLeague(ownerId, {
      platform: "ESPN",
      externalLeagueId: "666",
      name: "Tagging League",
      season: 2024,
    });
    const member = await leagueMemberService.createLeagueMember(ownerId, league.id, { teamName: "Team Tag" });
    leagueMemberId = member.id;

    const otherLeague = await leagueService.createLeague(otherOwnerId, {
      platform: "ESPN",
      externalLeagueId: "777",
      name: "Other Owner League",
      season: 2024,
    });
    const otherMember = await leagueMemberService.createLeagueMember(otherOwnerId, otherLeague.id, {
      teamName: "Not Yours",
    });
    otherOwnersLeagueMemberId = otherMember.id;

    const crewmate = await crewmateService.createCrewmate(ownerId, { displayName: "Taggable Friend" });
    crewmateId = crewmate.id;
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { createdById: { in: [ownerId, otherOwnerId] } } });
    await prisma.crewmate.deleteMany({ where: { ownerId: { in: [ownerId, otherOwnerId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherOwnerId] } } });
  });

  it("tags a league member owned by the same user", async () => {
    await crewmateTaggingService.tagLeagueMember(ownerId, crewmateId, leagueMemberId);

    const [crewmate] = await crewmateService.listCrewmates(ownerId);
    const taggedIds = crewmate.leagueMembers.map((link) => link.leagueMemberId);
    expect(taggedIds).toContain(leagueMemberId);
  });

  it("rejects a duplicate tag", async () => {
    await expect(
      crewmateTaggingService.tagLeagueMember(ownerId, crewmateId, leagueMemberId),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects tagging a league member from a league you don't own", async () => {
    await expect(
      crewmateTaggingService.tagLeagueMember(ownerId, crewmateId, otherOwnersLeagueMemberId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("untags a league member", async () => {
    await crewmateTaggingService.untagLeagueMember(ownerId, crewmateId, leagueMemberId);

    const [crewmate] = await crewmateService.listCrewmates(ownerId);
    expect(crewmate.leagueMembers).toHaveLength(0);

    await expect(
      crewmateTaggingService.untagLeagueMember(ownerId, crewmateId, leagueMemberId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

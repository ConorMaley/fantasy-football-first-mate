import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import * as crewmateService from "./crewmateService.js";
import { ConflictError, NotFoundError } from "./errors.js";

describe("crewmateService", () => {
  let ownerId: string;
  let otherOwnerId: string;
  let matchUserId: string;

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: { email: `crewmate-${randomUUID()}@test.local`, displayName: "Crewmate Owner" },
    });
    ownerId = owner.id;

    const otherOwner = await prisma.user.create({
      data: { email: `crewmate-other-${randomUUID()}@test.local`, displayName: "Other Owner" },
    });
    otherOwnerId = otherOwner.id;

    const matchUser = await prisma.user.create({
      data: { email: `crewmate-match-${randomUUID()}@test.local`, displayName: "Matchable User" },
    });
    matchUserId = matchUser.id;
  });

  afterAll(async () => {
    await prisma.crewmate.deleteMany({ where: { ownerId: { in: [ownerId, otherOwnerId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherOwnerId, matchUserId] } } });
  });

  it("creates a crewmate without an account match", async () => {
    const crewmate = await crewmateService.createCrewmate(ownerId, { displayName: "Unmatched Friend" });
    expect(crewmate.userId).toBeNull();
  });

  it("creates a crewmate matched to a real user and rejects a duplicate match", async () => {
    const crewmate = await crewmateService.createCrewmate(ownerId, {
      displayName: "Matched Friend",
      userId: matchUserId,
    });
    expect(crewmate.userId).toBe(matchUserId);
    expect(crewmate.user?.id).toBe(matchUserId);

    await expect(
      crewmateService.createCrewmate(ownerId, { displayName: "Duplicate Match", userId: matchUserId }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("scopes update and delete to the owning user", async () => {
    const crewmate = await crewmateService.createCrewmate(ownerId, { displayName: "Scoped Friend" });

    await expect(
      crewmateService.updateCrewmate(otherOwnerId, crewmate.id, { displayName: "Hijacked" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const updated = await crewmateService.updateCrewmate(ownerId, crewmate.id, { displayName: "Renamed Friend" });
    expect(updated.displayName).toBe("Renamed Friend");

    await crewmateService.deleteCrewmate(ownerId, crewmate.id);
    await expect(crewmateService.getOwnedCrewmate(ownerId, crewmate.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { getOwnedCrewmate } from "./crewmateService.js";
import { ConflictError, NotFoundError } from "./errors.js";

async function getOwnedLeagueMemberForTagging(ownerId: string, leagueMemberId: string) {
  const leagueMember = await prisma.leagueMember.findFirst({
    where: { id: leagueMemberId, league: { createdById: ownerId } },
  });
  if (!leagueMember) {
    throw new NotFoundError("League member not found.");
  }
  return leagueMember;
}

export async function tagLeagueMember(ownerId: string, crewmateId: string, leagueMemberId: string) {
  await getOwnedCrewmate(ownerId, crewmateId);
  await getOwnedLeagueMemberForTagging(ownerId, leagueMemberId);

  try {
    return await prisma.crewmateLeagueMember.create({
      data: { crewmateId, leagueMemberId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("This crewmate is already tagged to that league member.");
    }
    throw err;
  }
}

export async function untagLeagueMember(ownerId: string, crewmateId: string, leagueMemberId: string) {
  await getOwnedCrewmate(ownerId, crewmateId);

  const tag = await prisma.crewmateLeagueMember.findFirst({
    where: { crewmateId, leagueMemberId },
  });
  if (!tag) {
    throw new NotFoundError("Tag not found.");
  }
  await prisma.crewmateLeagueMember.delete({ where: { id: tag.id } });
}

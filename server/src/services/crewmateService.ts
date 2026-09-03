import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError } from "./errors.js";

export interface CrewmateInput {
  displayName: string;
  userId?: string | null;
}

const crewmateInclude = {
  user: { select: { id: true, displayName: true, email: true } },
  leagueMembers: {
    include: {
      leagueMember: {
        include: {
          league: { select: { id: true, name: true, platform: true, season: true } },
        },
      },
    },
  },
} satisfies Prisma.CrewmateInclude;

export function listCrewmates(ownerId: string) {
  return prisma.crewmate.findMany({
    where: { ownerId },
    include: crewmateInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function createCrewmate(ownerId: string, input: CrewmateInput) {
  try {
    return await prisma.crewmate.create({
      data: { ownerId, displayName: input.displayName, userId: input.userId ?? null },
      include: crewmateInclude,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("This user is already matched to one of your crewmates.");
    }
    throw err;
  }
}

export async function getOwnedCrewmate(ownerId: string, crewmateId: string) {
  const crewmate = await prisma.crewmate.findFirst({ where: { id: crewmateId, ownerId } });
  if (!crewmate) {
    throw new NotFoundError("Crewmate not found.");
  }
  return crewmate;
}

export async function updateCrewmate(ownerId: string, crewmateId: string, input: Partial<CrewmateInput>) {
  await getOwnedCrewmate(ownerId, crewmateId);
  try {
    return await prisma.crewmate.update({
      where: { id: crewmateId },
      data: input,
      include: crewmateInclude,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("This user is already matched to one of your crewmates.");
    }
    throw err;
  }
}

export async function deleteCrewmate(ownerId: string, crewmateId: string) {
  await getOwnedCrewmate(ownerId, crewmateId);
  await prisma.crewmate.delete({ where: { id: crewmateId } });
}

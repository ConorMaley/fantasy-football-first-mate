import type { Platform } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError } from "./errors.js";

export interface CreateLeagueInput {
  platform: Platform;
  externalLeagueId: string;
  name: string;
  season: number;
}

export interface UpdateLeagueInput {
  name?: string;
  season?: number;
  isActive?: boolean;
}

export function listLeagues(userId: string) {
  return prisma.league.findMany({
    where: { createdById: userId },
    include: {
      leagueGroup: true,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLeague(userId: string, input: CreateLeagueInput) {
  try {
    return await prisma.league.create({
      data: {
        platform: input.platform,
        externalLeagueId: input.externalLeagueId,
        name: input.name,
        season: input.season,
        createdById: userId,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("A league with this platform, external id, and season already exists.");
    }
    throw err;
  }
}

export async function getOwnedLeague(userId: string, leagueId: string) {
  const league = await prisma.league.findFirst({
    where: { id: leagueId, createdById: userId },
  });
  if (!league) {
    throw new NotFoundError("League not found.");
  }
  return league;
}

export async function updateLeague(userId: string, leagueId: string, input: UpdateLeagueInput) {
  await getOwnedLeague(userId, leagueId);
  return prisma.league.update({
    where: { id: leagueId },
    data: input,
  });
}

export async function deleteLeague(userId: string, leagueId: string) {
  await getOwnedLeague(userId, leagueId);
  await prisma.league.delete({ where: { id: leagueId } });
}

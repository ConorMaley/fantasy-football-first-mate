import type { League } from "@prisma/client";

import { NotFoundError } from "./errors.js";
import { prisma } from "./prisma.js";

/**
 * A league counts as "currently part of" a user when it's active, and the
 * user either created it or has been matched (via LeagueMember.userId) to
 * one of its member slots.
 */
function visibilityWhere(userId: string) {
  return {
    isActive: true,
    OR: [{ createdById: userId }, { members: { some: { userId } } }],
  };
}

export async function findVisibleLeagues(userId: string): Promise<League[]> {
  return prisma.league.findMany({
    where: visibilityWhere(userId),
    orderBy: [{ season: "desc" }, { name: "asc" }],
  });
}

/**
 * Resolves a league scoped to the current user, or throws NotFoundError if
 * the league doesn't exist or isn't visible to them — a league the user
 * can't see is treated as not-found, not forbidden, so its existence isn't
 * leaked.
 */
export async function assertLeagueAccess(userId: string, leagueId: string): Promise<League> {
  const league = await prisma.league.findFirst({
    where: { id: leagueId, ...visibilityWhere(userId) },
  });
  if (!league) {
    throw new NotFoundError("League not found");
  }
  return league;
}

import { randomUUID } from "node:crypto";

import { prisma } from "../lib/prisma.js";
import { getOwnedLeague } from "./leagueService.js";
import { NotFoundError } from "./errors.js";

export interface LeagueMemberInput {
  teamName?: string;
  externalDisplayName?: string;
}

export async function listLeagueMembers(userId: string, leagueId: string) {
  await getOwnedLeague(userId, leagueId);
  return prisma.leagueMember.findMany({
    where: { leagueId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createLeagueMember(userId: string, leagueId: string, input: LeagueMemberInput) {
  await getOwnedLeague(userId, leagueId);
  return prisma.leagueMember.create({
    data: {
      leagueId,
      teamId: randomUUID(),
      teamName: input.teamName,
      externalDisplayName: input.externalDisplayName,
    },
  });
}

export async function getOwnedLeagueMember(userId: string, leagueMemberId: string) {
  const member = await prisma.leagueMember.findFirst({
    where: { id: leagueMemberId, league: { createdById: userId } },
  });
  if (!member) {
    throw new NotFoundError("League member not found.");
  }
  return member;
}

export async function updateLeagueMember(userId: string, leagueMemberId: string, input: LeagueMemberInput) {
  await getOwnedLeagueMember(userId, leagueMemberId);
  return prisma.leagueMember.update({
    where: { id: leagueMemberId },
    data: input,
  });
}

export async function deleteLeagueMember(userId: string, leagueMemberId: string) {
  await getOwnedLeagueMember(userId, leagueMemberId);
  await prisma.leagueMember.delete({ where: { id: leagueMemberId } });
}

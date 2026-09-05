import { prisma } from "../lib/prisma.js";
import { getOwnedLeague } from "./leagueService.js";
import { NotFoundError } from "./errors.js";

export function listLeagueGroups(userId: string) {
  return prisma.leagueGroup.findMany({
    where: { ownerId: userId },
    include: { leagues: true },
    orderBy: { createdAt: "desc" },
  });
}

export function createLeagueGroup(userId: string, name: string) {
  return prisma.leagueGroup.create({
    data: { name, ownerId: userId },
  });
}

export async function getOwnedLeagueGroup(userId: string, groupId: string) {
  const group = await prisma.leagueGroup.findFirst({
    where: { id: groupId, ownerId: userId },
  });
  if (!group) {
    throw new NotFoundError("League group not found.");
  }
  return group;
}

export async function renameLeagueGroup(userId: string, groupId: string, name: string) {
  await getOwnedLeagueGroup(userId, groupId);
  return prisma.leagueGroup.update({ where: { id: groupId }, data: { name } });
}

export async function deleteLeagueGroup(userId: string, groupId: string) {
  await getOwnedLeagueGroup(userId, groupId);
  await prisma.leagueGroup.delete({ where: { id: groupId } });
}

export async function assignLeagueToGroup(userId: string, leagueId: string, groupId: string) {
  await getOwnedLeague(userId, leagueId);
  await getOwnedLeagueGroup(userId, groupId);
  return prisma.league.update({
    where: { id: leagueId },
    data: { leagueGroupId: groupId },
  });
}

export async function clearLeagueGroup(userId: string, leagueId: string) {
  await getOwnedLeague(userId, leagueId);
  return prisma.league.update({
    where: { id: leagueId },
    data: { leagueGroupId: null },
  });
}

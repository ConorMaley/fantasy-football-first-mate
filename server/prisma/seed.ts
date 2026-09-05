import "dotenv/config";

import type { PrismaClient, Position } from "@prisma/client";
import { TransactionItemAction, TransactionType } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password.js";
import { prisma } from "../src/lib/prisma.js";

// No dev-user shortcut: log in for real (password/OTP/magic-link/OAuth) in
// local dev, same as production. Alex gets a known password (below) so the
// E2E suite and manual testing can log in via POST /auth/password/login;
// sam/jordan are just sample "other people" for crewmate-tagging/search.
export const ALEX_EMAIL = "alex@firstmate.local";
export const JORDAN_EMAIL = "jordan@firstmate.local";
const SAMPLE_USERS = [
  { id: "sample-user-1", email: ALEX_EMAIL, displayName: "Alex Rivera" },
  { id: "sample-user-2", email: "sam@firstmate.local", displayName: "Sam Okafor" },
  { id: "sample-user-3", email: JORDAN_EMAIL, displayName: "Jordan Lee" },
];
export const SEED_SAMPLE_PASSWORD = process.env.SEED_SAMPLE_PASSWORD ?? "sample-password-123";

export const LEAGUE_A_NAME = "The Gridiron Gauntlet";
export const LEAGUE_B_NAME = "Dynasty Dominators";
export const LEAGUE_C_NAME = "Retired Legends";

const FIRST_NAMES = [
  "James", "Michael", "Chris", "Josh", "Justin", "Derek", "Marcus", "Tyler",
  "Brandon", "Kevin", "Anthony", "Ryan", "Jordan", "Austin", "Cole", "Trevor",
  "Devon", "Miles", "Xavier", "Cameron", "Isaiah", "Malik", "Dominic", "Elijah",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
  "Perez", "White", "Harris", "Clark", "Lewis", "Young", "Allen", "King",
];
const NFL_TEAMS = [
  "BUF", "MIA", "NE", "NYJ", "BAL", "CIN", "CLE", "PIT", "HOU", "IND", "JAX",
  "TEN", "DEN", "KC", "LV", "LAC", "DAL", "NYG", "PHI", "WAS", "CHI", "DET",
  "GB", "MIN", "ATL", "CAR", "NO", "TB", "ARI", "LAR", "SF", "SEA",
];
const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];
const TEAM_ADJECTIVES = [
  "Blazing", "Iron", "Rogue", "Thunder", "Shadow", "Golden", "Crimson",
  "Savage", "Northern", "Wild", "Silent", "Rusty", "Electric", "Frozen",
];
const TEAM_NOUNS = [
  "Wolves", "Eagles", "Titans", "Raptors", "Vipers", "Bears", "Falcons",
  "Sharks", "Bulls", "Hawks", "Comets", "Renegades", "Marauders", "Outlaws",
];

const STARTER_SLOTS = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "DST", "K"];
const BENCH_SIZE = 6;
const SLOTS_PER_TEAM = STARTER_SLOTS.length + BENCH_SIZE;
export const WEEK_COUNT = 6;
export const STARTER_COUNT = STARTER_SLOTS.length;
export const BENCH_COUNT = BENCH_SIZE;

/** Every league this seed creates is tagged with this externalLeagueId
 * prefix, so re-seeding only ever resets its own data — never leagues a
 * real user created through the admin UI. */
const SEED_LEAGUE_ID_PREFIX = "seed-";

function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length];
}

function randPoints(): number {
  return Math.round((4 + Math.random() * 24) * 10) / 10;
}

/** Rotates a fixed-team-count array so each week's pairings differ. */
function weekPairs<T>(teams: T[], week: number): [T, T][] {
  const rotated = [teams[0], ...teams.slice(1).map((_, i) => teams[1 + ((i + week) % (teams.length - 1))])];
  const pairs: [T, T][] = [];
  for (let i = 0; i < rotated.length; i += 2) {
    pairs.push([rotated[i], rotated[i + 1]]);
  }
  return pairs;
}

interface SeededMember {
  id: string;
  teamId: string;
  teamName: string;
}

export async function runSeed(prisma: PrismaClient): Promise<void> {
  const sampleUsers = new Map<string, { id: string; email: string }>();
  for (const user of SAMPLE_USERS) {
    const passwordHash = user.email === ALEX_EMAIL ? await hashPassword(SEED_SAMPLE_PASSWORD) : undefined;
    const created = await prisma.user.upsert({
      where: { id: user.id },
      update: passwordHash ? { passwordHash } : {},
      create: { ...user, passwordHash },
    });
    sampleUsers.set(user.email, created);
  }
  const alex = sampleUsers.get(ALEX_EMAIL)!;
  const jordan = sampleUsers.get(JORDAN_EMAIL)!;

  // Cascades from League.deleteMany() clear LeagueMember/Roster/RosterSlot/
  // Standing/Matchup/RosterMatchup/RosterMatchupSlot/Transaction/
  // TransactionItem. Player must go after (no other feature uses it, so it's
  // safe to fully reset once the leagues referencing it are gone).
  await prisma.league.deleteMany({ where: { externalLeagueId: { startsWith: SEED_LEAGUE_ID_PREFIX } } });
  await prisma.player.deleteMany();

  const PLAYER_COUNT = 260;
  const players = await prisma.player.createManyAndReturn({
    data: Array.from({ length: PLAYER_COUNT }, (_, i) => ({
      fullName: `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i * 7 + 3)}`,
      position: pick(POSITIONS, i),
      nflTeam: pick(NFL_TEAMS, i * 3 + 1),
    })),
  });
  let playerCursor = 0;
  function nextPlayers(count: number) {
    const slice = players.slice(playerCursor, playerCursor + count);
    playerCursor += count;
    return slice;
  }

  async function buildActiveLeague(opts: {
    name: string;
    platform: "ESPN" | "SLEEPER" | "YAHOO";
    season: number;
    createdById: string;
    teamCount: number;
    matchedMemberUserId?: { teamIndex: number; userId: string };
  }) {
    const league = await prisma.league.create({
      data: {
        name: opts.name,
        platform: opts.platform,
        season: opts.season,
        externalLeagueId: `${SEED_LEAGUE_ID_PREFIX}${opts.platform.toLowerCase()}-${opts.season}-${opts.name.replace(/\s+/g, "-").toLowerCase()}`,
        isActive: true,
        createdById: opts.createdById,
      },
    });

    const membersRaw = await prisma.leagueMember.createManyAndReturn({
      data: Array.from({ length: opts.teamCount }, (_, i) => ({
        leagueId: league.id,
        teamId: `team-${i + 1}`,
        teamName: `${pick(TEAM_ADJECTIVES, i)} ${pick(TEAM_NOUNS, i * 5 + 2)}`,
        externalDisplayName: `${pick(FIRST_NAMES, i * 11 + 1)} ${pick(LAST_NAMES, i * 13 + 1)}`,
        userId:
          opts.matchedMemberUserId && opts.matchedMemberUserId.teamIndex === i
            ? opts.matchedMemberUserId.userId
            : null,
      })),
    });
    const members: SeededMember[] = membersRaw.map((m) => ({
      id: m.id,
      teamId: m.teamId,
      teamName: m.teamName ?? "",
    }));

    // Rosters + lineups, one per member.
    const rosters = await prisma.roster.createManyAndReturn({
      data: members.map((m) => ({ leagueMemberId: m.id })),
    });
    const rosterByMember = new Map(rosters.map((r) => [r.leagueMemberId, r.id]));
    const lineupByMember = new Map<string, { playerId: string; lineupSlot: string; isStarter: boolean }[]>();
    const rosterSlotRows: { rosterId: string; playerId: string; lineupSlot: string; isStarter: boolean }[] = [];
    for (const member of members) {
      const teamPlayers = nextPlayers(SLOTS_PER_TEAM);
      const lineup = teamPlayers.map((p, i) => ({
        playerId: p.id,
        lineupSlot: i < STARTER_SLOTS.length ? STARTER_SLOTS[i] : "BN",
        isStarter: i < STARTER_SLOTS.length,
      }));
      lineupByMember.set(member.id, lineup);
      const rosterId = rosterByMember.get(member.id)!;
      for (const slot of lineup) {
        rosterSlotRows.push({ rosterId, ...slot });
      }
    }
    await prisma.rosterSlot.createMany({ data: rosterSlotRows });

    // Matchups for each week, using each member's current lineup as their
    // weekly lineup (kept simple — same lineup every week).
    for (let week = 1; week <= WEEK_COUNT; week++) {
      const pairs = weekPairs(members, week);
      for (const [home, away] of pairs) {
        const matchup = await prisma.matchup.create({ data: { leagueId: league.id, week } });
        for (const side of [home, away]) {
          const lineup = lineupByMember.get(side.id)!;
          const slotPoints = lineup.map((slot) => ({ ...slot, points: randPoints(), projectedPoints: randPoints() }));
          const score = Math.round(
            slotPoints.filter((s) => s.isStarter).reduce((sum, s) => sum + s.points, 0) * 10,
          ) / 10;
          const rosterMatchup = await prisma.rosterMatchup.create({
            data: {
              matchupId: matchup.id,
              leagueMemberId: side.id,
              score,
              projectedScore: Math.round((score + (Math.random() * 6 - 3)) * 10) / 10,
            },
          });
          await prisma.rosterMatchupSlot.createMany({
            data: slotPoints.map((s) => ({
              rosterMatchupId: rosterMatchup.id,
              playerId: s.playerId,
              lineupSlot: s.lineupSlot,
              isStarter: s.isStarter,
              points: s.points,
              projectedPoints: s.projectedPoints,
            })),
          });
        }
      }
    }

    // Derive standings from the RosterMatchup rows just written, so
    // standings and matchups can never contradict each other.
    const record = new Map(members.map((m) => [m.id, { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 }]));
    const allRosterMatchups = await prisma.rosterMatchup.findMany({
      where: { leagueMember: { leagueId: league.id } },
      select: { leagueMemberId: true, score: true, matchupId: true },
    });
    const byMatchup = new Map<string, typeof allRosterMatchups>();
    for (const rm of allRosterMatchups) {
      const list = byMatchup.get(rm.matchupId) ?? [];
      list.push(rm);
      byMatchup.set(rm.matchupId, list);
    }
    for (const pair of byMatchup.values()) {
      if (pair.length !== 2) continue;
      const [a, b] = pair;
      const recA = record.get(a.leagueMemberId)!;
      const recB = record.get(b.leagueMemberId)!;
      recA.pointsFor += a.score ?? 0;
      recA.pointsAgainst += b.score ?? 0;
      recB.pointsFor += b.score ?? 0;
      recB.pointsAgainst += a.score ?? 0;
      if ((a.score ?? 0) > (b.score ?? 0)) {
        recA.wins += 1;
        recB.losses += 1;
      } else if ((a.score ?? 0) < (b.score ?? 0)) {
        recB.wins += 1;
        recA.losses += 1;
      } else {
        recA.ties += 1;
        recB.ties += 1;
      }
    }
    const ranked = [...members].sort((x, y) => {
      const rx = record.get(x.id)!;
      const ry = record.get(y.id)!;
      if (ry.wins !== rx.wins) return ry.wins - rx.wins;
      return ry.pointsFor - rx.pointsFor;
    });
    await prisma.standing.createMany({
      data: ranked.map((m, i) => {
        const r = record.get(m.id)!;
        return {
          leagueMemberId: m.id,
          wins: r.wins,
          losses: r.losses,
          ties: r.ties,
          pointsFor: Math.round(r.pointsFor * 10) / 10,
          pointsAgainst: Math.round(r.pointsAgainst * 10) / 10,
          rank: i + 1,
        };
      }),
    });

    // A handful of transactions: a waiver add, a bench drop, a two-player
    // trade (4 items), a waiver claim (add+drop), and a free-agent drop
    // (null leagueMemberId).
    const freeAgents = nextPlayers(6);
    const baseDate = new Date("2025-09-15T00:00:00Z");
    await prisma.transaction.create({
      data: {
        leagueId: league.id,
        type: TransactionType.ADD,
        externalId: `${league.id}-txn-add`,
        processedAt: new Date(baseDate.getTime() + 1000 * 60 * 60 * 24 * 3),
        items: {
          create: [{ action: TransactionItemAction.ADDED, playerId: freeAgents[0].id, leagueMemberId: members[0].id }],
        },
      },
    });
    await prisma.transaction.create({
      data: {
        leagueId: league.id,
        type: TransactionType.DROP,
        externalId: `${league.id}-txn-drop`,
        processedAt: new Date(baseDate.getTime() + 1000 * 60 * 60 * 24 * 5),
        items: {
          create: [
            {
              action: TransactionItemAction.DROPPED,
              playerId: lineupByMember.get(members[1].id)![STARTER_SLOTS.length].playerId,
              leagueMemberId: members[1].id,
            },
          ],
        },
      },
    });
    const tradeMemberA = members[2];
    const tradeMemberB = members[3 % members.length];
    const tradePlayerA = lineupByMember.get(tradeMemberA.id)![0].playerId;
    const tradePlayerB = lineupByMember.get(tradeMemberB.id)![0].playerId;
    await prisma.transaction.create({
      data: {
        leagueId: league.id,
        type: TransactionType.TRADE,
        externalId: `${league.id}-txn-trade`,
        processedAt: new Date(baseDate.getTime() + 1000 * 60 * 60 * 24 * 10),
        items: {
          create: [
            { action: TransactionItemAction.DROPPED, playerId: tradePlayerA, leagueMemberId: tradeMemberA.id },
            { action: TransactionItemAction.ADDED, playerId: tradePlayerA, leagueMemberId: tradeMemberB.id },
            { action: TransactionItemAction.DROPPED, playerId: tradePlayerB, leagueMemberId: tradeMemberB.id },
            { action: TransactionItemAction.ADDED, playerId: tradePlayerB, leagueMemberId: tradeMemberA.id },
          ],
        },
      },
    });
    await prisma.transaction.create({
      data: {
        leagueId: league.id,
        type: TransactionType.WAIVER_CLAIM,
        externalId: `${league.id}-txn-waiver`,
        processedAt: new Date(baseDate.getTime() + 1000 * 60 * 60 * 24 * 14),
        items: {
          create: [
            { action: TransactionItemAction.ADDED, playerId: freeAgents[1].id, leagueMemberId: members[4 % members.length].id },
            {
              action: TransactionItemAction.DROPPED,
              playerId: lineupByMember.get(members[4 % members.length].id)![STARTER_SLOTS.length + 1].playerId,
              leagueMemberId: members[4 % members.length].id,
            },
          ],
        },
      },
    });
    await prisma.transaction.create({
      data: {
        leagueId: league.id,
        type: TransactionType.DROP,
        externalId: `${league.id}-txn-free-agent-drop`,
        processedAt: new Date(baseDate.getTime() + 1000 * 60 * 60 * 24 * 20),
        items: {
          create: [{ action: TransactionItemAction.DROPPED, playerId: freeAgents[2].id, leagueMemberId: null }],
        },
      },
    });

    return league;
  }

  const leagueA = await buildActiveLeague({
    name: LEAGUE_A_NAME,
    platform: "ESPN",
    season: 2025,
    createdById: alex.id,
    teamCount: 8,
  });

  const leagueB = await buildActiveLeague({
    name: LEAGUE_B_NAME,
    platform: "SLEEPER",
    season: 2025,
    createdById: jordan.id,
    teamCount: 6,
    matchedMemberUserId: { teamIndex: 0, userId: alex.id },
  });

  // Inactive league — kept lightweight, exists purely to prove the
  // dashboard's isActive filter actually excludes it.
  const leagueC = await prisma.league.create({
    data: {
      name: LEAGUE_C_NAME,
      platform: "YAHOO",
      season: 2024,
      externalLeagueId: `${SEED_LEAGUE_ID_PREFIX}yahoo-2024-retired-legends`,
      isActive: false,
      createdById: alex.id,
    },
  });
  await prisma.leagueMember.createMany({
    data: Array.from({ length: 4 }, (_, i) => ({
      leagueId: leagueC.id,
      teamId: `team-${i + 1}`,
      teamName: `${pick(TEAM_ADJECTIVES, i + 20)} ${pick(TEAM_NOUNS, i + 20)}`,
    })),
  });

  console.log(`Seeded ${SAMPLE_USERS.length} sample users (login as ${ALEX_EMAIL} / "${SEED_SAMPLE_PASSWORD}").`);
  console.log(`Seeded ${players.length} players.`);
  console.log(
    `Seeded leagues: ${leagueA.name} (active, alex=creator), ${leagueB.name} (active, alex=matched member), ${leagueC.name} (inactive).`,
  );
}

async function main() {
  try {
    await runSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

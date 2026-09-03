-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ESPN', 'YAHOO', 'SLEEPER');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('QB', 'RB', 'WR', 'TE', 'K', 'DST');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ADD', 'DROP', 'TRADE', 'WAIVER_CLAIM', 'COMMISSIONER');

-- CreateEnum
CREATE TYPE "TransactionItemAction" AS ENUM ('ADDED', 'DROPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueLink" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LeagueLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EspnLeagueLink" (
    "id" TEXT NOT NULL,
    "swid" TEXT NOT NULL,
    "espnS2" TEXT NOT NULL,
    "leagueLinkId" TEXT NOT NULL,

    CONSTRAINT "EspnLeagueLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YahooLeagueLink" (
    "id" TEXT NOT NULL,
    "externalUserId" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "leagueLinkId" TEXT NOT NULL,

    CONSTRAINT "YahooLeagueLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleeperLeagueLink" (
    "id" TEXT NOT NULL,
    "externalUsername" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "leagueLinkId" TEXT NOT NULL,

    CONSTRAINT "SleeperLeagueLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalLeagueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "leagueLinkId" TEXT,
    "leagueGroupId" TEXT,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "LeagueGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT,
    "externalDisplayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "LeagueMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "nflTeam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerExternalId" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "PlayerExternalId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roster" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leagueMemberId" TEXT NOT NULL,

    CONSTRAINT "Roster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosterSlot" (
    "id" TEXT NOT NULL,
    "lineupSlot" TEXT NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT true,
    "rosterId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "RosterSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standing" (
    "id" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "pointsFor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pointsAgainst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "streak" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leagueMemberId" TEXT NOT NULL,

    CONSTRAINT "Standing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matchup" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "Matchup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosterMatchup" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "projectedScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matchupId" TEXT NOT NULL,
    "leagueMemberId" TEXT NOT NULL,

    CONSTRAINT "RosterMatchup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosterMatchupSlot" (
    "id" TEXT NOT NULL,
    "lineupSlot" TEXT NOT NULL,
    "isStarter" BOOLEAN NOT NULL,
    "points" DOUBLE PRECISION,
    "projectedPoints" DOUBLE PRECISION,
    "rosterMatchupId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "RosterMatchupSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "externalId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionItem" (
    "id" TEXT NOT NULL,
    "action" "TransactionItemAction" NOT NULL,
    "transactionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "leagueMemberId" TEXT,

    CONSTRAINT "TransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crewmate" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Crewmate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewmateLeagueMember" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crewmateId" TEXT NOT NULL,
    "leagueMemberId" TEXT NOT NULL,

    CONSTRAINT "CrewmateLeagueMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueLink_userId_platform_key" ON "LeagueLink"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "EspnLeagueLink_leagueLinkId_key" ON "EspnLeagueLink"("leagueLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "YahooLeagueLink_leagueLinkId_key" ON "YahooLeagueLink"("leagueLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "SleeperLeagueLink_leagueLinkId_key" ON "SleeperLeagueLink"("leagueLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "League_createdById_platform_externalLeagueId_season_key" ON "League"("createdById", "platform", "externalLeagueId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMember_leagueId_teamId_key" ON "LeagueMember"("leagueId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerExternalId_platform_externalId_key" ON "PlayerExternalId"("platform", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Roster_leagueMemberId_key" ON "Roster"("leagueMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "RosterSlot_rosterId_playerId_key" ON "RosterSlot"("rosterId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Standing_leagueMemberId_key" ON "Standing"("leagueMemberId");

-- CreateIndex
CREATE INDEX "Matchup_leagueId_week_idx" ON "Matchup"("leagueId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "RosterMatchup_matchupId_leagueMemberId_key" ON "RosterMatchup"("matchupId", "leagueMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "RosterMatchupSlot_rosterMatchupId_playerId_key" ON "RosterMatchupSlot"("rosterMatchupId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_leagueId_externalId_key" ON "Transaction"("leagueId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Crewmate_ownerId_userId_key" ON "Crewmate"("ownerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewmateLeagueMember_crewmateId_leagueMemberId_key" ON "CrewmateLeagueMember"("crewmateId", "leagueMemberId");

-- AddForeignKey
ALTER TABLE "LeagueLink" ADD CONSTRAINT "LeagueLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EspnLeagueLink" ADD CONSTRAINT "EspnLeagueLink_leagueLinkId_fkey" FOREIGN KEY ("leagueLinkId") REFERENCES "LeagueLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YahooLeagueLink" ADD CONSTRAINT "YahooLeagueLink_leagueLinkId_fkey" FOREIGN KEY ("leagueLinkId") REFERENCES "LeagueLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleeperLeagueLink" ADD CONSTRAINT "SleeperLeagueLink_leagueLinkId_fkey" FOREIGN KEY ("leagueLinkId") REFERENCES "LeagueLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_leagueLinkId_fkey" FOREIGN KEY ("leagueLinkId") REFERENCES "LeagueLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_leagueGroupId_fkey" FOREIGN KEY ("leagueGroupId") REFERENCES "LeagueGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueGroup" ADD CONSTRAINT "LeagueGroup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerExternalId" ADD CONSTRAINT "PlayerExternalId_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roster" ADD CONSTRAINT "Roster_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterSlot" ADD CONSTRAINT "RosterSlot_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "Roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterSlot" ADD CONSTRAINT "RosterSlot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterMatchup" ADD CONSTRAINT "RosterMatchup_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "Matchup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterMatchup" ADD CONSTRAINT "RosterMatchup_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterMatchupSlot" ADD CONSTRAINT "RosterMatchupSlot_rosterMatchupId_fkey" FOREIGN KEY ("rosterMatchupId") REFERENCES "RosterMatchup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterMatchupSlot" ADD CONSTRAINT "RosterMatchupSlot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crewmate" ADD CONSTRAINT "Crewmate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crewmate" ADD CONSTRAINT "Crewmate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewmateLeagueMember" ADD CONSTRAINT "CrewmateLeagueMember_crewmateId_fkey" FOREIGN KEY ("crewmateId") REFERENCES "Crewmate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewmateLeagueMember" ADD CONSTRAINT "CrewmateLeagueMember_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

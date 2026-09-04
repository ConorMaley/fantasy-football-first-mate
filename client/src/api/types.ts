export type Platform = "ESPN" | "YAHOO" | "SLEEPER";

export interface MatchupSide {
  leagueMemberId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  score: number | null;
  projectedScore: number | null;
}

export interface MatchupSummary {
  id: string;
  sides: MatchupSide[];
}

export interface StandingRow {
  leagueMemberId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number | null;
  streak: string | null;
}

export interface DashboardLeagueSummary {
  id: string;
  name: string;
  platform: Platform;
  season: number;
  latestWeek: number | null;
  matchups: MatchupSummary[];
  standings: StandingRow[];
}

export interface DashboardResponse {
  leagues: DashboardLeagueSummary[];
}

export interface LeagueSummary {
  id: string;
  name: string;
  platform: Platform;
  season: number;
}

export interface StandingsResponse {
  standings: StandingRow[];
}

export interface MatchupsForWeekResponse {
  week: number | null;
  availableWeeks: number[];
  matchups: MatchupSummary[];
}

export interface BoxScorePlayer {
  playerId: string;
  fullName: string;
  position: string;
  nflTeam: string | null;
  lineupSlot: string;
  points: number | null;
  projectedPoints: number | null;
}

export interface BoxScoreSide {
  leagueMemberId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  score: number | null;
  projectedScore: number | null;
  starters: BoxScorePlayer[];
  bench: BoxScorePlayer[];
}

export interface BoxScoreResponse {
  id: string;
  week: number;
  sides: BoxScoreSide[];
}

export interface TeamSummary {
  teamId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  isCurrentUser: boolean;
}

export interface TeamsResponse {
  teams: TeamSummary[];
}

export interface RosterPlayer {
  playerId: string;
  fullName: string;
  position: string;
  nflTeam: string | null;
  lineupSlot: string;
}

export interface TeamRosterResponse {
  teamId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  starters: RosterPlayer[];
  bench: RosterPlayer[];
}

export interface TransactionTeamRef {
  teamId: string;
  teamName: string | null;
  externalDisplayName: string | null;
}

export interface TransactionItemSummary {
  action: "ADDED" | "DROPPED";
  player: { fullName: string; position: string };
  team: TransactionTeamRef | null;
}

export interface TransactionSummary {
  id: string;
  type: string;
  processedAt: string | null;
  items: TransactionItemSummary[];
}

export interface TransactionsResponse {
  transactions: TransactionSummary[];
}

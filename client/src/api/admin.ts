import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type Platform = "ESPN" | "YAHOO" | "SLEEPER";

export interface LeagueGroup {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  leagues?: League[];
}

export interface League {
  id: string;
  platform: Platform;
  externalLeagueId: string;
  name: string;
  season: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  leagueGroupId: string | null;
  leagueGroup?: LeagueGroup | null;
  _count?: { members: number };
}

export interface LeagueMember {
  id: string;
  teamId: string;
  teamName: string | null;
  externalDisplayName: string | null;
  leagueId: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  displayName: string;
  email: string;
}

export interface CrewmateLeagueMemberTag {
  id: string;
  crewmateId: string;
  leagueMemberId: string;
  createdAt: string;
  leagueMember: LeagueMember & {
    league: { id: string; name: string; platform: Platform; season: number };
  };
}

export interface Crewmate {
  id: string;
  displayName: string;
  ownerId: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserSummary | null;
  leagueMembers: CrewmateLeagueMemberTag[];
}

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
  leagueGroupId?: string | null;
}

export interface LeagueMemberInput {
  teamName?: string;
  externalDisplayName?: string;
}

export interface CrewmateInput {
  displayName: string;
  userId?: string | null;
}

export const listLeagues = () => apiGet<League[]>("/leagues");
export const createLeague = (input: CreateLeagueInput) => apiPost<League>("/leagues", input);
export const updateLeague = (id: string, input: UpdateLeagueInput) => apiPatch<League>(`/leagues/${id}`, input);
export const deleteLeague = (id: string) => apiDelete<void>(`/leagues/${id}`);

export const listLeagueGroups = () => apiGet<LeagueGroup[]>("/league-groups");
export const createLeagueGroup = (name: string) => apiPost<LeagueGroup>("/league-groups", { name });
export const renameLeagueGroup = (id: string, name: string) =>
  apiPatch<LeagueGroup>(`/league-groups/${id}`, { name });
export const deleteLeagueGroup = (id: string) => apiDelete<void>(`/league-groups/${id}`);

export const listLeagueMembers = (leagueId: string) => apiGet<LeagueMember[]>(`/leagues/${leagueId}/members`);
export const createLeagueMember = (leagueId: string, input: LeagueMemberInput) =>
  apiPost<LeagueMember>(`/leagues/${leagueId}/members`, input);
export const updateLeagueMember = (id: string, input: LeagueMemberInput) =>
  apiPatch<LeagueMember>(`/league-members/${id}`, input);
export const deleteLeagueMember = (id: string) => apiDelete<void>(`/league-members/${id}`);

export const listCrewmates = () => apiGet<Crewmate[]>("/crewmates");
export const createCrewmate = (input: CrewmateInput) => apiPost<Crewmate>("/crewmates", input);
export const updateCrewmate = (id: string, input: Partial<CrewmateInput>) =>
  apiPatch<Crewmate>(`/crewmates/${id}`, input);
export const deleteCrewmate = (id: string) => apiDelete<void>(`/crewmates/${id}`);

export const tagLeagueMember = (crewmateId: string, leagueMemberId: string) =>
  apiPost<CrewmateLeagueMemberTag>(`/crewmates/${crewmateId}/league-members`, { leagueMemberId });
export const untagLeagueMember = (crewmateId: string, leagueMemberId: string) =>
  apiDelete<void>(`/crewmates/${crewmateId}/league-members/${leagueMemberId}`);

export const searchUsers = (query: string) =>
  apiGet<UserSummary[]>(`/users?search=${encodeURIComponent(query)}`);

import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { DashboardLeagueSummary } from "../api/types";
import { MatchupRow } from "./MatchupRow";
import { StandingsTable } from "./StandingsTable";

export function LeagueCard({ league }: { league: DashboardLeagueSummary }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/league/${league.id}/matchups`)}
      className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <Text className="text-lg font-semibold text-slate-900">{league.name}</Text>
      <Text className="mt-1 text-xs uppercase tracking-wide text-slate-500">
        {league.platform} · {league.season}
      </Text>

      {league.latestWeek != null && (
        <View className="mt-4">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Week {league.latestWeek} Matchups
          </Text>
          {league.matchups.map((matchup) => (
            <MatchupRow key={matchup.id} matchup={matchup} />
          ))}
        </View>
      )}

      {league.standings.length > 0 && (
        <View className="mt-4">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Standings</Text>
          <StandingsTable standings={league.standings} />
        </View>
      )}
    </Pressable>
  );
}

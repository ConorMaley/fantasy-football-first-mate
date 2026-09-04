import { Text, View } from "react-native";

import type { StandingRow } from "../api/types";

function teamLabel(row: StandingRow): string {
  return row.teamName ?? row.externalDisplayName ?? "Unnamed team";
}

export function StandingsTable({ standings }: { standings: StandingRow[] }) {
  return (
    <View>
      <View className="flex-row items-center border-b border-slate-200 pb-1">
        <Text className="w-6 text-xs font-semibold text-slate-500">#</Text>
        <Text className="flex-1 text-xs font-semibold text-slate-500">Team</Text>
        <Text className="w-16 text-right text-xs font-semibold text-slate-500">W-L-T</Text>
        <Text className="w-14 text-right text-xs font-semibold text-slate-500">PF</Text>
        <Text className="w-14 text-right text-xs font-semibold text-slate-500">PA</Text>
      </View>
      {standings.map((row) => (
        <View key={row.leagueMemberId} className="flex-row items-center border-b border-slate-100 py-1.5">
          <Text className="w-6 text-xs text-slate-500">{row.rank ?? "—"}</Text>
          <Text className="flex-1 text-sm text-slate-800" numberOfLines={1}>
            {teamLabel(row)}
          </Text>
          <Text className="w-16 text-right text-xs text-slate-600">
            {row.wins}-{row.losses}-{row.ties}
          </Text>
          <Text className="w-14 text-right text-xs text-slate-600">{row.pointsFor.toFixed(1)}</Text>
          <Text className="w-14 text-right text-xs text-slate-600">{row.pointsAgainst.toFixed(1)}</Text>
        </View>
      ))}
    </View>
  );
}

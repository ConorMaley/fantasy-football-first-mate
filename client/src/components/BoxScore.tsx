import { Text, View } from "react-native";

import type { BoxScorePlayer, BoxScoreSide } from "../api/types";

function formatPoints(points: number | null): string {
  return points == null ? "—" : points.toFixed(1);
}

function PlayerRow({ player }: { player: BoxScorePlayer }) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 py-1.5">
      <View className="flex-1 flex-row items-center gap-2">
        <Text className="w-10 text-xs font-semibold text-slate-400">{player.lineupSlot}</Text>
        <Text className="flex-1 text-sm text-slate-800" numberOfLines={1}>
          {player.fullName}
        </Text>
        <Text className="text-xs text-slate-400">
          {player.position}
          {player.nflTeam ? ` · ${player.nflTeam}` : ""}
        </Text>
      </View>
      <Text className="w-12 text-right text-sm font-medium text-slate-900">{formatPoints(player.points)}</Text>
    </View>
  );
}

function SideColumn({ side }: { side: BoxScoreSide }) {
  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-900">
          {side.teamName ?? side.externalDisplayName ?? "Unnamed team"}
        </Text>
        <Text className="text-base font-bold text-slate-900">{formatPoints(side.score)}</Text>
      </View>

      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Starters</Text>
      {side.starters.map((player) => (
        <PlayerRow key={player.playerId} player={player} />
      ))}

      <Text className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Bench</Text>
      {side.bench.map((player) => (
        <PlayerRow key={player.playerId} player={player} />
      ))}
    </View>
  );
}

export function BoxScore({ sides }: { sides: BoxScoreSide[] }) {
  return (
    <View>
      {sides.map((side) => (
        <SideColumn key={side.leagueMemberId} side={side} />
      ))}
    </View>
  );
}

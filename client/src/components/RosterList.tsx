import { Text, View } from "react-native";

import type { RosterPlayer } from "../api/types";

function PlayerRow({ player }: { player: RosterPlayer }) {
  return (
    <View className="flex-row items-center border-b border-slate-100 py-1.5">
      <Text className="w-10 text-xs font-semibold text-slate-400">{player.lineupSlot}</Text>
      <Text className="flex-1 text-sm text-slate-800" numberOfLines={1}>
        {player.fullName}
      </Text>
      <Text className="text-xs text-slate-400">
        {player.position}
        {player.nflTeam ? ` · ${player.nflTeam}` : ""}
      </Text>
    </View>
  );
}

export function RosterList({ starters, bench }: { starters: RosterPlayer[]; bench: RosterPlayer[] }) {
  return (
    <View>
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Starters</Text>
      {starters.map((player) => (
        <PlayerRow key={player.playerId} player={player} />
      ))}

      <Text className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Bench</Text>
      {bench.map((player) => (
        <PlayerRow key={player.playerId} player={player} />
      ))}
    </View>
  );
}

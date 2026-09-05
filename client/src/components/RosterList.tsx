import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import type { RosterPlayer } from "../api/types";

function PlayerRow({ player }: { player: RosterPlayer }) {
  return (
    <View style={styles.row}>
      <Text variant="labelMedium" style={styles.slot}>
        {player.lineupSlot}
      </Text>
      <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
        {player.fullName}
      </Text>
      <Text variant="labelSmall" style={styles.meta}>
        {player.position}
        {player.nflTeam ? ` · ${player.nflTeam}` : ""}
      </Text>
    </View>
  );
}

export function RosterList({ starters, bench }: { starters: RosterPlayer[]; bench: RosterPlayer[] }) {
  return (
    <View>
      <Text variant="labelLarge" style={styles.sectionLabel}>
        Starters
      </Text>
      {starters.map((player) => (
        <PlayerRow key={player.playerId} player={player} />
      ))}

      <Text variant="labelLarge" style={[styles.sectionLabel, styles.benchLabel]}>
        Bench
      </Text>
      {bench.map((player) => (
        <PlayerRow key={player.playerId} player={player} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginBottom: 4, opacity: 0.6, textTransform: "uppercase" },
  benchLabel: { marginTop: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  slot: { width: 40, opacity: 0.6 },
  name: { flex: 1 },
  meta: { opacity: 0.6 },
});

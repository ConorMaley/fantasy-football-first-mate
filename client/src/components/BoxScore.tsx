import { StyleSheet, View } from "react-native";
import { Divider, Text } from "react-native-paper";

import type { BoxScorePlayer, BoxScoreSide } from "../api/types";

function formatPoints(points: number | null): string {
  return points == null ? "—" : points.toFixed(1);
}

function PlayerRow({ player }: { player: BoxScorePlayer }) {
  return (
    <View style={styles.playerRow}>
      <Text variant="labelMedium" style={styles.slot}>
        {player.lineupSlot}
      </Text>
      <Text variant="bodyMedium" style={styles.playerName} numberOfLines={1}>
        {player.fullName}
      </Text>
      <Text variant="labelSmall" style={styles.playerMeta}>
        {player.position}
        {player.nflTeam ? ` · ${player.nflTeam}` : ""}
      </Text>
      <Text variant="titleSmall" style={styles.points}>
        {formatPoints(player.points)}
      </Text>
    </View>
  );
}

function SideColumn({ side }: { side: BoxScoreSide }) {
  return (
    <View style={styles.side}>
      <View style={styles.sideHeader}>
        <Text variant="titleMedium">{side.teamName ?? side.externalDisplayName ?? "Unnamed team"}</Text>
        <Text variant="titleMedium">{formatPoints(side.score)}</Text>
      </View>

      <Text variant="labelLarge" style={styles.sectionLabel}>
        Starters
      </Text>
      {side.starters.map((player) => (
        <PlayerRow key={player.playerId} player={player} />
      ))}

      <Text variant="labelLarge" style={[styles.sectionLabel, styles.benchLabel]}>
        Bench
      </Text>
      {side.bench.map((player) => (
        <PlayerRow key={player.playerId} player={player} />
      ))}
    </View>
  );
}

export function BoxScore({ sides }: { sides: BoxScoreSide[] }) {
  return (
    <View>
      {sides.map((side, i) => (
        <View key={side.leagueMemberId}>
          <SideColumn side={side} />
          {i < sides.length - 1 && <Divider style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  side: { marginBottom: 8 },
  sideHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionLabel: { marginBottom: 4, opacity: 0.6, textTransform: "uppercase" },
  benchLabel: { marginTop: 12 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  slot: { width: 40, opacity: 0.6 },
  playerName: { flex: 1 },
  playerMeta: { opacity: 0.6 },
  points: { width: 48, textAlign: "right" },
  divider: { marginVertical: 16 },
});

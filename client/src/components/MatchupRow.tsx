import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import type { MatchupSummary, MatchupSide } from "../api/types";

function teamLabel(side: MatchupSide): string {
  return side.teamName ?? side.externalDisplayName ?? "Unnamed team";
}

function formatScore(score: number | null): string {
  return score == null ? "—" : score.toFixed(1);
}

export function MatchupRow({ matchup, onPress }: { matchup: MatchupSummary; onPress?: () => void }) {
  const Container = onPress ? Pressable : View;

  if (matchup.sides.length < 2) {
    const [side] = matchup.sides;
    return (
      <Container onPress={onPress} style={styles.row}>
        <Text variant="bodyMedium" style={styles.teamName}>
          {side ? teamLabel(side) : "Unknown team"}
        </Text>
        <Text variant="labelMedium">BYE</Text>
      </Container>
    );
  }

  const [home, away] = matchup.sides;
  return (
    <Container onPress={onPress} style={styles.matchup}>
      <View style={styles.line}>
        <Text variant="bodyMedium" style={styles.teamName} numberOfLines={1}>
          {teamLabel(home)}
        </Text>
        <Text variant="titleSmall" style={styles.score}>
          {formatScore(home.score)}
        </Text>
      </View>
      <View style={styles.line}>
        <Text variant="bodyMedium" style={styles.teamName} numberOfLines={1}>
          {teamLabel(away)}
        </Text>
        <Text variant="titleSmall" style={styles.score}>
          {formatScore(away.score)}
        </Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  matchup: {
    paddingVertical: 8,
    gap: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  line: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  teamName: { flex: 1 },
  score: { width: 48, textAlign: "right" },
});

import { ScrollView, StyleSheet } from "react-native";
import { Chip } from "react-native-paper";

import type { TeamSummary } from "../api/types";

export function TeamList({
  teams,
  selectedTeamId,
  onSelect,
}: {
  teams: TeamSummary[];
  selectedTeamId: string | null;
  onSelect: (teamId: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {teams.map((team) => (
        <Chip
          key={team.teamId}
          testID={`team-chip-${team.teamId}`}
          selected={team.teamId === selectedTeamId}
          onPress={() => onSelect(team.teamId)}
          style={styles.chip}
        >
          {team.teamName ?? team.externalDisplayName ?? "Unnamed team"}
          {team.isCurrentUser ? " (You)" : ""}
        </Chip>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  chip: { marginRight: 8 },
});

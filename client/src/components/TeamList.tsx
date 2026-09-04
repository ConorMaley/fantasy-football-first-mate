import { Pressable, ScrollView, Text } from "react-native";

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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      {teams.map((team) => {
        const selected = team.teamId === selectedTeamId;
        return (
          <Pressable
            key={team.teamId}
            testID={`team-chip-${team.teamId}`}
            onPress={() => onSelect(team.teamId)}
            className={`mr-2 rounded-full border px-3 py-1.5 ${selected ? "border-blue-600 bg-blue-600" : "border-slate-200 bg-white"}`}
          >
            <Text className={`text-sm font-medium ${selected ? "text-white" : "text-slate-700"}`}>
              {team.teamName ?? team.externalDisplayName ?? "Unnamed team"}
              {team.isCurrentUser ? " (You)" : ""}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

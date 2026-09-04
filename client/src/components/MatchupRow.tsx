import { Pressable, Text, View } from "react-native";

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
      <Container onPress={onPress} className="flex-row items-center justify-between border-b border-slate-100 py-2">
        <Text className="flex-1 text-sm text-slate-800">{side ? teamLabel(side) : "Unknown team"}</Text>
        <Text className="text-sm font-medium text-slate-500">BYE</Text>
      </Container>
    );
  }

  const [home, away] = matchup.sides;
  return (
    <Container onPress={onPress} className="border-b border-slate-100 py-2">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-sm text-slate-800" numberOfLines={1}>
          {teamLabel(home)}
        </Text>
        <Text className="w-12 text-right text-sm font-semibold text-slate-900">{formatScore(home.score)}</Text>
      </View>
      <View className="mt-0.5 flex-row items-center justify-between">
        <Text className="flex-1 text-sm text-slate-800" numberOfLines={1}>
          {teamLabel(away)}
        </Text>
        <Text className="w-12 text-right text-sm font-semibold text-slate-900">{formatScore(away.score)}</Text>
      </View>
    </Container>
  );
}

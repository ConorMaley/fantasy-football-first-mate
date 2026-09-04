import { useGlobalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import type { BoxScoreResponse } from "../../../../src/api/types";
import { useApiQuery } from "../../../../src/api/useApiQuery";
import { BoxScore } from "../../../../src/components/BoxScore";
import { ErrorState } from "../../../../src/components/ErrorState";
import { LoadingState } from "../../../../src/components/LoadingState";

export default function MatchupDetailScreen() {
  const { id, matchupId } = useGlobalSearchParams<{ id: string; matchupId: string }>();
  const path = id && matchupId ? `/leagues/${id}/matchups/${matchupId}` : null;
  const { data, status, error, refetch } = useApiQuery<BoxScoreResponse>(path);

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-4">
        {status === "loading" && <LoadingState label="Loading box score…" />}

        {status === "error" && (
          <ErrorState message={error?.message ?? "Unable to load this matchup."} onRetry={refetch} />
        )}

        {status === "success" && data && <BoxScore sides={data.sides} />}
      </View>
    </ScrollView>
  );
}

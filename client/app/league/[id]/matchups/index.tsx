import { useGlobalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { MatchupsForWeekResponse } from "../../../../src/api/types";
import { useApiQuery } from "../../../../src/api/useApiQuery";
import { EmptyState } from "../../../../src/components/EmptyState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { LoadingState } from "../../../../src/components/LoadingState";
import { MatchupRow } from "../../../../src/components/MatchupRow";
import { WeekSelector } from "../../../../src/components/WeekSelector";

export default function MatchupsTab() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const path = id ? `/leagues/${id}/matchups${selectedWeek != null ? `?week=${selectedWeek}` : ""}` : null;
  const { data, status, error, refetch } = useApiQuery<MatchupsForWeekResponse>(path);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {status === "loading" && <LoadingState label="Loading matchups…" />}

        {status === "error" && (
          <ErrorState message={error?.message ?? "Unable to load matchups."} onRetry={refetch} />
        )}

        {status === "success" && data && data.week == null && <EmptyState message="No matchups yet." />}

        {status === "success" && data && data.week != null && (
          <>
            <WeekSelector week={data.week} availableWeeks={data.availableWeeks} onChange={setSelectedWeek} />
            {data.matchups.length === 0 ? (
              <EmptyState message="No matchups for this week." />
            ) : (
              data.matchups.map((matchup) => (
                <MatchupRow
                  key={matchup.id}
                  matchup={matchup}
                  onPress={() => router.push(`/league/${id}/matchups/${matchup.id}`)}
                />
              ))
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});

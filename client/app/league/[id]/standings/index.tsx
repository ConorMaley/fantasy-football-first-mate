import { useGlobalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import type { StandingsResponse } from "../../../../src/api/types";
import { useApiQuery } from "../../../../src/api/useApiQuery";
import { EmptyState } from "../../../../src/components/EmptyState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { LoadingState } from "../../../../src/components/LoadingState";
import { StandingsTable } from "../../../../src/components/StandingsTable";

export default function StandingsTab() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { data, status, error, refetch } = useApiQuery<StandingsResponse>(id ? `/leagues/${id}/standings` : null);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {status === "loading" && <LoadingState label="Loading standings…" />}

        {status === "error" && (
          <ErrorState message={error?.message ?? "Unable to load standings."} onRetry={refetch} />
        )}

        {status === "success" && data && data.standings.length === 0 && (
          <EmptyState message="No standings yet." />
        )}

        {status === "success" && data && data.standings.length > 0 && (
          <StandingsTable standings={data.standings} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});

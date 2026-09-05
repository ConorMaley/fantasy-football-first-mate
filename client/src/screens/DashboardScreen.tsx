import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import type { DashboardResponse } from "../api/types";
import { useApiQuery } from "../api/useApiQuery";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LeagueCard } from "../components/LeagueCard";
import { LoadingState } from "../components/LoadingState";

export function DashboardScreen() {
  const { data, status, error, refetch } = useApiQuery<DashboardResponse>("/dashboard");

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Your Leagues
        </Text>

        {status === "loading" && <LoadingState label="Loading your leagues…" />}

        {status === "error" && (
          <ErrorState message={error?.message ?? "Unable to reach the server."} onRetry={refetch} />
        )}

        {status === "success" && data && data.leagues.length === 0 && (
          <EmptyState message="No active leagues yet." />
        )}

        {status === "success" &&
          data &&
          data.leagues.map((league) => <LeagueCard key={league.id} league={league} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { marginBottom: 16 },
});

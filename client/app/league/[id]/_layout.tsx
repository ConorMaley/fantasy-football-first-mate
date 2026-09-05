import { Stack, Tabs, useGlobalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import type { LeagueSummary } from "../../../src/api/types";
import { useApiQuery } from "../../../src/api/useApiQuery";

export default function LeagueLayout() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { data, status, error } = useApiQuery<LeagueSummary>(id ? `/leagues/${id}` : null);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: data?.name ?? "" }} />
      <View style={styles.header}>
        {status === "loading" && <Text variant="bodyMedium">Loading league…</Text>}
        {status === "error" && (
          <Text variant="bodyMedium" style={styles.errorText}>
            {error?.message ?? "Unable to load this league."}
          </Text>
        )}
        {status === "success" && data && (
          <>
            <Text variant="headlineSmall">{data.name}</Text>
            <Text variant="labelMedium" style={styles.subtitle}>
              {data.platform} · {data.season}
            </Text>
          </>
        )}
      </View>
      <Tabs screenOptions={{ headerShown: false, tabBarIcon: () => null }}>
        <Tabs.Screen name="matchups" options={{ title: "Matchups" }} />
        <Tabs.Screen name="standings" options={{ title: "Standings" }} />
        <Tabs.Screen name="rosters" options={{ title: "Rosters" }} />
        <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e2e8f0" },
  subtitle: { marginTop: 2, opacity: 0.6, textTransform: "uppercase" },
  errorText: { color: "#dc2626" },
});

import { Tabs, useGlobalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import type { LeagueSummary } from "../../../src/api/types";
import { useApiQuery } from "../../../src/api/useApiQuery";

export default function LeagueLayout() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { data, status, error } = useApiQuery<LeagueSummary>(id ? `/leagues/${id}` : null);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="border-b border-slate-200 bg-white px-4 pb-3 pt-4">
        {status === "loading" && <Text className="text-sm text-slate-500">Loading league…</Text>}
        {status === "error" && (
          <Text className="text-sm text-red-600">{error?.message ?? "Unable to load this league."}</Text>
        )}
        {status === "success" && data && (
          <>
            <Text className="text-xl font-bold text-slate-900">{data.name}</Text>
            <Text className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
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

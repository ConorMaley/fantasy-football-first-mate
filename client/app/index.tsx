import { ScrollView, Text, View } from "react-native";

import type { DashboardResponse } from "../src/api/types";
import { useApiQuery } from "../src/api/useApiQuery";
import { EmptyState } from "../src/components/EmptyState";
import { ErrorState } from "../src/components/ErrorState";
import { LeagueCard } from "../src/components/LeagueCard";
import { LoadingState } from "../src/components/LoadingState";

export default function DashboardScreen() {
  const { data, status, error, refetch } = useApiQuery<DashboardResponse>("/dashboard");

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="mb-4 text-2xl font-bold text-slate-900">Your Leagues</Text>

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
    </View>
  );
}

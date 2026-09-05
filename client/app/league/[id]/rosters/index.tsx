import { useGlobalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { TeamRosterResponse, TeamsResponse } from "../../../../src/api/types";
import { useApiQuery } from "../../../../src/api/useApiQuery";
import { EmptyState } from "../../../../src/components/EmptyState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { LoadingState } from "../../../../src/components/LoadingState";
import { RosterList } from "../../../../src/components/RosterList";
import { TeamList } from "../../../../src/components/TeamList";

export default function RostersTab() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const teamsQuery = useApiQuery<TeamsResponse>(id ? `/leagues/${id}/rosters` : null);

  useEffect(() => {
    if (selectedTeamId != null || !teamsQuery.data) return;
    const ownTeam = teamsQuery.data.teams.find((t) => t.isCurrentUser);
    const initial = ownTeam ?? teamsQuery.data.teams[0];
    if (initial) {
      setSelectedTeamId(initial.teamId);
    }
  }, [teamsQuery.data, selectedTeamId]);

  const rosterPath = id && selectedTeamId ? `/leagues/${id}/rosters/${selectedTeamId}` : null;
  const rosterQuery = useApiQuery<TeamRosterResponse>(rosterPath);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {teamsQuery.status === "loading" && <LoadingState label="Loading teams…" />}

        {teamsQuery.status === "error" && (
          <ErrorState message={teamsQuery.error?.message ?? "Unable to load teams."} onRetry={teamsQuery.refetch} />
        )}

        {teamsQuery.status === "success" && teamsQuery.data && teamsQuery.data.teams.length === 0 && (
          <EmptyState message="No teams yet." />
        )}

        {teamsQuery.status === "success" && teamsQuery.data && teamsQuery.data.teams.length > 0 && (
          <>
            <TeamList teams={teamsQuery.data.teams} selectedTeamId={selectedTeamId} onSelect={setSelectedTeamId} />

            {rosterQuery.status === "loading" && <LoadingState label="Loading roster…" />}

            {rosterQuery.status === "error" && (
              <ErrorState
                message={rosterQuery.error?.message ?? "Unable to load roster."}
                onRetry={rosterQuery.refetch}
              />
            )}

            {rosterQuery.status === "success" && rosterQuery.data && (
              <RosterList starters={rosterQuery.data.starters} bench={rosterQuery.data.bench} />
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

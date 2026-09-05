import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import type { DashboardLeagueSummary } from "../api/types";
import { MatchupRow } from "./MatchupRow";
import { StandingsTable } from "./StandingsTable";

export function LeagueCard({ league }: { league: DashboardLeagueSummary }) {
  const router = useRouter();

  return (
    <Card style={styles.card} onPress={() => router.push(`/league/${league.id}/matchups`)}>
      <Card.Content>
        <Text variant="titleLarge">{league.name}</Text>
        <Text variant="labelMedium" style={styles.subtitle}>
          {league.platform} · {league.season}
        </Text>

        {league.latestWeek != null && (
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Week {league.latestWeek} Matchups
            </Text>
            {league.matchups.map((matchup) => (
              <MatchupRow key={matchup.id} matchup={matchup} />
            ))}
          </View>
        )}

        {league.standings.length > 0 && (
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Standings
            </Text>
            <StandingsTable standings={league.standings} />
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  subtitle: { marginTop: 2, opacity: 0.6, textTransform: "uppercase" },
  section: { marginTop: 16 },
  sectionLabel: { marginBottom: 4, opacity: 0.6, textTransform: "uppercase" },
});

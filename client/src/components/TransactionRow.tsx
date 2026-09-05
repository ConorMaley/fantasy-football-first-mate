import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import type { TransactionSummary, TransactionTeamRef } from "../api/types";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function teamLabel(team: TransactionTeamRef | null): string {
  if (!team) return "Free agency";
  return team.teamName ?? team.externalDisplayName ?? "Unnamed team";
}

export function TransactionRow({ transaction }: { transaction: TransactionSummary }) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="labelLarge" style={styles.type}>
            {transaction.type.replace(/_/g, " ")}
          </Text>
          <Text variant="labelSmall" style={styles.date}>
            {formatDate(transaction.processedAt)}
          </Text>
        </View>
        {transaction.items.map((item, i) => (
          <Text key={i} variant="bodyMedium">
            {teamLabel(item.team)} {item.action === "ADDED" ? "added" : "dropped"} {item.player.fullName}
          </Text>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  type: { textTransform: "uppercase", opacity: 0.6 },
  date: { opacity: 0.6 },
});

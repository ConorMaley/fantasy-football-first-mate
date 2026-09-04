import { Text, View } from "react-native";

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
    <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {transaction.type.replace(/_/g, " ")}
        </Text>
        <Text className="text-xs text-slate-400">{formatDate(transaction.processedAt)}</Text>
      </View>
      {transaction.items.map((item, i) => (
        <Text key={i} className="text-sm text-slate-800">
          {teamLabel(item.team)} {item.action === "ADDED" ? "added" : "dropped"} {item.player.fullName}
        </Text>
      ))}
    </View>
  );
}

import { View } from "react-native";

import type { TransactionSummary } from "../api/types";
import { TransactionRow } from "./TransactionRow";

export function TransactionFeed({ transactions }: { transactions: TransactionSummary[] }) {
  return (
    <View>
      {transactions.map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
    </View>
  );
}

import { useGlobalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import type { TransactionsResponse } from "../../../../src/api/types";
import { useApiQuery } from "../../../../src/api/useApiQuery";
import { EmptyState } from "../../../../src/components/EmptyState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { LoadingState } from "../../../../src/components/LoadingState";
import { TransactionFeed } from "../../../../src/components/TransactionFeed";

export default function TransactionsTab() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { data, status, error, refetch } = useApiQuery<TransactionsResponse>(
    id ? `/leagues/${id}/transactions` : null,
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {status === "loading" && <LoadingState label="Loading transactions…" />}

        {status === "error" && (
          <ErrorState message={error?.message ?? "Unable to load transactions."} onRetry={refetch} />
        )}

        {status === "success" && data && data.transactions.length === 0 && (
          <EmptyState message="No transactions yet." />
        )}

        {status === "success" && data && data.transactions.length > 0 && (
          <TransactionFeed transactions={data.transactions} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});

import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Something went wrong</Text>
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
      <Button mode="contained" onPress={onRetry} style={styles.retry}>
        Retry
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 64, paddingHorizontal: 24 },
  message: { textAlign: "center", opacity: 0.7 },
  retry: { marginTop: 8 },
});

import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text variant="bodyMedium" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 64 },
  label: { opacity: 0.7 },
});

import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: 24 },
  message: { textAlign: "center", opacity: 0.7 },
});

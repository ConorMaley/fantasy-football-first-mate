import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";

export function WeekSelector({
  week,
  availableWeeks,
  onChange,
}: {
  week: number;
  availableWeeks: number[];
  onChange: (week: number) => void;
}) {
  const index = availableWeeks.indexOf(week);
  const canGoBack = index > 0;
  const canGoForward = index >= 0 && index < availableWeeks.length - 1;

  return (
    <View style={styles.container}>
      <IconButton
        icon="chevron-left"
        accessibilityLabel="Previous week"
        disabled={!canGoBack}
        onPress={() => canGoBack && onChange(availableWeeks[index - 1])}
      />
      <Text variant="titleMedium">Week {week}</Text>
      <IconButton
        icon="chevron-right"
        accessibilityLabel="Next week"
        disabled={!canGoForward}
        onPress={() => canGoForward && onChange(availableWeeks[index + 1])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 4,
  },
});

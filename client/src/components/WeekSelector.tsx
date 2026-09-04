import { Pressable, Text, View } from "react-native";

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
    <View className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
      <Pressable
        disabled={!canGoBack}
        onPress={() => canGoBack && onChange(availableWeeks[index - 1])}
        className={`rounded-full px-3 py-1 ${canGoBack ? "bg-slate-100" : "opacity-30"}`}
      >
        <Text className="text-sm font-medium text-slate-700">Prev</Text>
      </Pressable>
      <Text className="text-base font-semibold text-slate-900">Week {week}</Text>
      <Pressable
        disabled={!canGoForward}
        onPress={() => canGoForward && onChange(availableWeeks[index + 1])}
        className={`rounded-full px-3 py-1 ${canGoForward ? "bg-slate-100" : "opacity-30"}`}
      >
        <Text className="text-sm font-medium text-slate-700">Next</Text>
      </Pressable>
    </View>
  );
}

import { ActivityIndicator, Text, View } from "react-native";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View className="items-center justify-center gap-3 py-16">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="text-sm text-slate-500">{label}</Text>
    </View>
  );
}

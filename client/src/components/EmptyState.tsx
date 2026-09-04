import { Text, View } from "react-native";

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <Text className="text-center text-sm text-slate-500">{message}</Text>
    </View>
  );
}

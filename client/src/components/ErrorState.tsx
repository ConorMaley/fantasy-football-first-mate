import { Pressable, Text, View } from "react-native";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-16">
      <Text className="text-base font-semibold text-slate-800">Something went wrong</Text>
      <Text className="text-center text-sm text-slate-500">{message}</Text>
      <Pressable onPress={onRetry} className="mt-2 rounded-full bg-blue-600 px-5 py-2">
        <Text className="font-medium text-white">Retry</Text>
      </Pressable>
    </View>
  );
}

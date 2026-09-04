import "../global.css";

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "First Mate" }} />
      <Stack.Screen name="league/[id]" options={{ title: "" }} />
    </Stack>
  );
}

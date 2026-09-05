import { Stack } from "expo-router";

import { PasswordEntryScreen } from "../src/auth/screens/PasswordEntryScreen";

export default function PasswordRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PasswordEntryScreen />
    </>
  );
}

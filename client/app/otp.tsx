import { Stack } from "expo-router";

import { OtpEntryScreen } from "../src/auth/screens/OtpEntryScreen";

export default function OtpRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OtpEntryScreen />
    </>
  );
}

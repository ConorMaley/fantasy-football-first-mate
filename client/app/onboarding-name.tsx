import { Stack } from "expo-router";

import { OnboardingNameScreen } from "../src/auth/screens/OnboardingNameScreen";

export default function OnboardingNameRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingNameScreen />
    </>
  );
}

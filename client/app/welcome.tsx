import { Stack } from "expo-router";

import { WelcomeScreen } from "../src/auth/screens/WelcomeScreen";

export default function WelcomeRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WelcomeScreen />
    </>
  );
}

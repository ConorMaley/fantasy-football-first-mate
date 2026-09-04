import { Stack } from "expo-router";

import { LogoutButton } from "../src/auth/LogoutButton";
import { AdminScreen } from "../src/screens/AdminScreen";

export default function IndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerRight: () => <LogoutButton /> }} />
      <AdminScreen />
    </>
  );
}

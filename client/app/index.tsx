import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { IconButton } from "react-native-paper";

import { LogoutButton } from "../src/auth/LogoutButton";
import { DashboardScreen } from "../src/screens/DashboardScreen";

export default function IndexRoute() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "First Mate",
          headerRight: () => (
            <>
              <IconButton icon="cog-outline" accessibilityLabel="Admin" onPress={() => router.push("/admin")} />
              <LogoutButton />
            </>
          ),
        }}
      />
      <DashboardScreen />
    </>
  );
}

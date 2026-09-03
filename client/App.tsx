import { StatusBar } from "expo-status-bar";

import { SessionProvider } from "./src/auth/SessionContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SessionProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </SessionProvider>
  );
}

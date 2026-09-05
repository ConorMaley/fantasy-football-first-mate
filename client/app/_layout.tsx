import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";

import { AuthGate } from "../src/auth/AuthGate";
import { SessionProvider } from "../src/auth/SessionContext";

export default function RootLayout() {
  return (
    <PaperProvider>
      <SessionProvider>
        <AuthGate />
        <StatusBar style="auto" />
      </SessionProvider>
    </PaperProvider>
  );
}

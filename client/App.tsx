import { StatusBar } from "expo-status-bar";

import { HealthCheckScreen } from "./src/screens/HealthCheckScreen";

export default function App() {
  return (
    <>
      <HealthCheckScreen />
      <StatusBar style="auto" />
    </>
  );
}

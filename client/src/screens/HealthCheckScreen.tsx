import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { apiGet } from "../api/client";

type HealthResponse = {
  status: string;
};

export function HealthCheckScreen() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    apiGet<HealthResponse>("/health")
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fantasy Football First Mate</Text>
      <Text>Server status: {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
});

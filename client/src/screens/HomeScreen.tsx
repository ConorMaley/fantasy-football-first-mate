import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useSession } from "../auth/SessionContext";
import { HealthCheckScreen } from "./HealthCheckScreen";

export function HomeScreen() {
  const { user, logout } = useSession();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const showVerifyBanner = Boolean(user && !user.emailVerified && !bannerDismissed);

  return (
    <View style={styles.container}>
      {showVerifyBanner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Verify your email — check your inbox for a link.</Text>
          <Pressable onPress={() => setBannerDismissed(true)}>
            <Text style={styles.bannerDismiss}>Dismiss</Text>
          </Pressable>
        </View>
      ) : null}

      <HealthCheckScreen />

      <Pressable style={styles.logout} onPress={() => logout()}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    backgroundColor: "#fff3cd",
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  bannerText: { color: "#7a5c00", fontSize: 13 },
  bannerDismiss: { color: "#7a5c00", fontSize: 13, fontWeight: "700" },
  logout: { padding: 14, alignItems: "center" },
  logoutText: { color: "#c0392b", fontSize: 14 },
});

import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import { ApiError, apiPatch } from "../../api/client";
import { useSession, type SessionUser } from "../SessionContext";

/** Shown once, right after a first signup via OTP/magic-link/OAuth, when the account has no displayName yet. */
export function OnboardingNameScreen() {
  const { setUser } = useSession();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const response = await apiPatch<{ user: SessionUser }>("/auth/me", { displayName: name.trim() });
      setUser(response.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your name. Try again.");
    } finally {
      setBusy(false);
    }
  }, [name, setUser]);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        What should we call you?
      </Text>
      <Text style={styles.subtitle}>This is shown to your leaguemates and Crewmates.</Text>

      <TextInput mode="outlined" label="Your name" value={name} onChangeText={setName} autoFocus />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button mode="contained" onPress={handleSave} loading={busy} disabled={busy || name.trim().length === 0}>
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", padding: 24, gap: 12 },
  title: { textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 8 },
  error: { color: "#B3261E", fontSize: 13 },
});

import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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
      <Text style={styles.title}>What should we call you?</Text>
      <Text style={styles.subtitle}>This is shown to your leaguemates and Crewmates.</Text>

      <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} autoFocus />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleSave} disabled={busy || name.trim().length === 0}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Continue</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: "#c0392b", fontSize: 13 },
  primaryButton: { backgroundColor: "#1d4ed8", borderRadius: 8, padding: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});

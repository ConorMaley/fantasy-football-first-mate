import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import { ApiError, apiPost } from "../../api/client";
import { useSession, type AuthResponse } from "../SessionContext";

export function OtpEntryScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { applySession } = useSession();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const handleVerify = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const auth = await apiPost<AuthResponse>(
        "/auth/otp/verify",
        { email, code, platform: Platform.OS === "web" ? "web" : "native" },
        { skipAuth: true },
      );
      await applySession(auth);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }, [email, code, applySession]);

  const handleResend = useCallback(async () => {
    setError(null);
    setResent(false);
    try {
      await apiPost("/auth/otp/request", { email }, { skipAuth: true });
      setResent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't resend the code. Try again.");
    }
  }, [email]);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Check your email
      </Text>
      <Text style={styles.subtitle}>Enter the 6-digit code we sent to {email}</Text>

      <TextInput
        mode="outlined"
        label="Code"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {resent ? <Text style={styles.info}>Code resent.</Text> : null}

      <Button mode="contained" onPress={handleVerify} loading={busy} disabled={busy || code.length !== 6}>
        Verify
      </Button>

      <Button mode="text" onPress={handleResend}>
        Resend code
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", padding: 24, gap: 12 },
  title: { textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 8 },
  error: { color: "#B3261E", fontSize: 13 },
  info: { color: "#2e7d32", fontSize: 13 },
});

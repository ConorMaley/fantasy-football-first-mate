import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError, apiPost } from "../../api/client";
import { useSession, type AuthResponse } from "../SessionContext";
import type { AuthStackParamList } from "../types";

type Props = NativeStackScreenProps<AuthStackParamList, "OtpEntry">;

export function OtpEntryScreen({ route }: Props) {
  const { email } = route.params;
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
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code we sent to {email}</Text>

      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {resent ? <Text style={styles.info}>Code resent.</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleVerify} disabled={busy || code.length !== 6}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Verify</Text>}
      </Pressable>

      <Pressable style={styles.link} onPress={handleResend}>
        <Text style={styles.linkText}>Resend code</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: "center",
  },
  error: { color: "#c0392b", fontSize: 13 },
  info: { color: "#2e7d32", fontSize: 13 },
  primaryButton: { backgroundColor: "#1d4ed8", borderRadius: 8, padding: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { alignItems: "center", padding: 8 },
  linkText: { color: "#1d4ed8", fontSize: 13 },
});

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import { ApiError, apiPost } from "../../api/client";
import { useSession, type AuthResponse } from "../SessionContext";

type Mode = "login" | "signup";

export function PasswordEntryScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const { applySession } = useSession();
  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const auth = await apiPost<AuthResponse>(
        mode === "login" ? "/auth/password/login" : "/auth/password/signup",
        { email, password, platform: Platform.OS === "web" ? "web" : "native" },
        { skipAuth: true },
      );
      await applySession(auth);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }, [mode, email, password, applySession]);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {mode === "login" ? "Log in" : "Create your account"}
      </Text>

      <TextInput
        mode="outlined"
        label="Email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput mode="outlined" label="Password" secureTextEntry value={password} onChangeText={setPassword} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button mode="contained" onPress={handleSubmit} loading={busy} disabled={busy || !email || !password}>
        {mode === "login" ? "Log in" : "Create account"}
      </Button>

      <Button mode="text" onPress={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </Button>

      <Button mode="text" onPress={() => router.push("/welcome")}>
        Forgot your password? Log in with a code instead
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", padding: 24, gap: 12 },
  title: { textAlign: "center", marginBottom: 8 },
  error: { color: "#B3261E", fontSize: 13 },
});

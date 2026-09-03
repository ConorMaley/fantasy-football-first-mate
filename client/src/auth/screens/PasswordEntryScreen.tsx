import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError, apiPost } from "../../api/client";
import { useSession, type AuthResponse } from "../SessionContext";
import type { AuthStackParamList } from "../types";

type Props = NativeStackScreenProps<AuthStackParamList, "PasswordEntry">;

type Mode = "login" | "signup";

export function PasswordEntryScreen({ route, navigation }: Props) {
  const { applySession } = useSession();
  const [email, setEmail] = useState(route.params?.email ?? "");
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
      <Text style={styles.title}>{mode === "login" ? "Log in" : "Create your account"}</Text>

      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={busy || !email || !password}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>{mode === "login" ? "Log in" : "Create account"}</Text>
        )}
      </Pressable>

      <Pressable style={styles.link} onPress={() => setMode(mode === "login" ? "signup" : "login")}>
        <Text style={styles.linkText}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.link}
        onPress={() => navigation.navigate("Welcome")}
      >
        <Text style={styles.linkText}>Forgot your password? Log in with a code instead</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: "#c0392b", fontSize: 13 },
  primaryButton: { backgroundColor: "#1d4ed8", borderRadius: 8, padding: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { alignItems: "center", padding: 8 },
  linkText: { color: "#1d4ed8", fontSize: 13 },
});

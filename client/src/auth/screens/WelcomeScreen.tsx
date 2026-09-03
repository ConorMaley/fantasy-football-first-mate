import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as AppleAuthentication from "expo-apple-authentication";
import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError, apiPost } from "../../api/client";
import { useSession, type AuthResponse } from "../SessionContext";
import type { AuthStackParamList } from "../types";
import { useGoogleSignIn } from "../useGoogleSignIn";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  const { applySession } = useSession();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinueWithEmail = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await apiPost("/auth/otp/request", { email }, { skipAuth: true });
      navigation.navigate("OtpEntry", { email });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }, [email, navigation]);

  const handleGoogleIdToken = useCallback(
    async (idToken: string) => {
      setError(null);
      setBusy(true);
      try {
        const auth = await apiPost<AuthResponse>(
          "/auth/oauth/google",
          { idToken, platform: Platform.OS === "web" ? "web" : "native" },
          { skipAuth: true },
        );
        await applySession(auth);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Google sign-in failed. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [applySession],
  );

  const { ready: googleReady, promptAsync: promptGoogle } = useGoogleSignIn(handleGoogleIdToken);

  const handleApple = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      if (!credential.identityToken) {
        throw new Error("Apple did not return an identity token");
      }
      const auth = await apiPost<AuthResponse>(
        "/auth/oauth/apple",
        { idToken: credential.identityToken, platform: "native" },
        { skipAuth: true },
      );
      await applySession(auth);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if ((err as { code?: string })?.code !== "ERR_REQUEST_CANCELED") {
        setError("Apple sign-in failed. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }, [applySession]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fantasy Football First Mate</Text>
      <Text style={styles.subtitle}>Enter your email to sign up or log in</Text>

      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleContinueWithEmail} disabled={busy || !email}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Continue</Text>}
      </Pressable>

      <Pressable
        style={styles.link}
        onPress={() => navigation.navigate("PasswordEntry", { email: email || undefined })}
      >
        <Text style={styles.linkText}>Have a password? Log in with password</Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        style={styles.secondaryButton}
        onPress={() => promptGoogle()}
        disabled={!googleReady || busy}
      >
        <Text style={styles.secondaryButtonText}>Continue with Google</Text>
      </Pressable>

      {Platform.OS === "ios" ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.appleButton}
          onPress={handleApple}
        />
      ) : null}
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
  link: { alignItems: "center", padding: 8 },
  linkText: { color: "#1d4ed8", fontSize: 13 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  secondaryButtonText: { fontSize: 16, fontWeight: "500" },
  appleButton: { height: 48, marginTop: 8 },
});

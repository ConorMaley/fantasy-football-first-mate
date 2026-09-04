import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { useCallback, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import { ApiError, apiPost } from "../../api/client";
import { useSession, type AuthResponse } from "../SessionContext";
import { useGoogleSignIn } from "../useGoogleSignIn";

export function WelcomeScreen() {
  const router = useRouter();
  const { applySession } = useSession();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinueWithEmail = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await apiPost("/auth/otp/request", { email }, { skipAuth: true });
      router.push({ pathname: "/otp", params: { email } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }, [email, router]);

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
      <Text variant="headlineMedium" style={styles.title}>
        Fantasy Football First Mate
      </Text>
      <Text style={styles.subtitle}>Enter your email to sign up or log in</Text>

      <TextInput
        mode="outlined"
        label="Email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button mode="contained" onPress={handleContinueWithEmail} loading={busy} disabled={busy || !email}>
        Continue
      </Button>

      <Button mode="text" onPress={() => router.push({ pathname: "/password", params: { email } })}>
        Have a password? Log in with password
      </Button>

      <View style={styles.divider} />

      <Button mode="outlined" onPress={() => promptGoogle()} disabled={!googleReady || busy}>
        Continue with Google
      </Button>

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
  title: { textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 8 },
  error: { color: "#B3261E", fontSize: 13 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  appleButton: { height: 48, marginTop: 8 },
});

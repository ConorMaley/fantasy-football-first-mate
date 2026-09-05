import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef } from "react";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

/**
 * Client-driven Google sign-in via expo-auth-session's implicit id_token
 * flow (no client secret needed — safe for a public/native client). Returns
 * a Google id_token that the caller POSTs to /api/auth/oauth/google for
 * server-side verification; this hook never talks to our backend itself.
 */
export function useGoogleSignIn(onIdToken: (idToken: string) => void) {
  const nonceRef = useRef(Crypto.randomUUID());
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ["openid", "email", "profile"],
      redirectUri: AuthSession.makeRedirectUri(),
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: { nonce: nonceRef.current },
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === "success" && typeof response.params.id_token === "string") {
      onIdToken(response.params.id_token);
    }
  }, [response, onIdToken]);

  return { ready: Boolean(request) && Boolean(clientId), promptAsync };
}

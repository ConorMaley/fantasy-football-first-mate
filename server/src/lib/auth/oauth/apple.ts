import appleSignin from "apple-signin-auth";

import type { OAuthIdentity } from "./types.js";

function getClientId(): string {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("APPLE_CLIENT_ID environment variable is required");
  }
  return clientId;
}

export async function verifyAppleIdToken(idToken: string): Promise<OAuthIdentity> {
  const clientId = getClientId();
  const payload = await appleSignin.verifyIdToken(idToken, { audience: clientId });

  if (!payload.sub || !payload.email) {
    throw new Error("Invalid Apple id token");
  }

  return {
    providerAccountId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
  };
}

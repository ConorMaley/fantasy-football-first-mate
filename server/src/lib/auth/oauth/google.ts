import { OAuth2Client } from "google-auth-library";

import type { OAuthIdentity } from "./types.js";

function getClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is required");
  }
  return clientId;
}

export async function verifyGoogleIdToken(idToken: string): Promise<OAuthIdentity> {
  const clientId = getClientId();
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new Error("Invalid Google id token");
  }

  return {
    providerAccountId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    name: payload.name,
  };
}

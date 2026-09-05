import { randomUUID } from "node:crypto";

import { createSession } from "../lib/auth/session.js";
import { prisma } from "../lib/prisma.js";

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.test`;
}

/** A Bearer `Authorization` header value for a real session, for supertest
 * calls against routes behind requireAuth. */
export async function authHeaderFor(userId: string): Promise<string> {
  const { accessToken } = await createSession(userId);
  return `Bearer ${accessToken}`;
}

/** Deletes everything tied to a test email: User (cascades to Session/OAuthAccount) plus any OTP/magic-link rows. */
export async function cleanupEmail(email: string): Promise<void> {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.otpCode.deleteMany({ where: { email } });
  await prisma.magicLinkToken.deleteMany({ where: { email } });
}

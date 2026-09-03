import { randomUUID } from "node:crypto";

import { prisma } from "../lib/prisma.js";

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.test`;
}

/** Deletes everything tied to a test email: User (cascades to Session/OAuthAccount) plus any OTP/magic-link rows. */
export async function cleanupEmail(email: string): Promise<void> {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.otpCode.deleteMany({ where: { email } });
  await prisma.magicLinkToken.deleteMany({ where: { email } });
}

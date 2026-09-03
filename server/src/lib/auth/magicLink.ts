import { prisma } from "../prisma.js";
import {
  generateOpaqueToken,
  hashToken,
  MAGIC_LINK_EXPIRY_MS,
  OTP_MAX_REQUESTS_PER_WINDOW,
  OTP_REQUEST_WINDOW_MS,
} from "./tokens.js";

export async function isMagicLinkRequestAllowed(email: string): Promise<boolean> {
  const since = new Date(Date.now() - OTP_REQUEST_WINDOW_MS);
  const count = await prisma.magicLinkToken.count({ where: { email, createdAt: { gte: since } } });
  return count < OTP_MAX_REQUESTS_PER_WINDOW;
}

/** Returns the raw (unhashed) token to embed in the emailed link — never persisted or logged in plaintext. */
export async function createMagicLinkToken(email: string): Promise<string> {
  const token = generateOpaqueToken();
  await prisma.magicLinkToken.create({
    data: { email, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MS) },
  });
  return token;
}

export type MagicLinkVerifyResult = { ok: true; email: string } | { ok: false };

export async function verifyMagicLinkToken(token: string): Promise<MagicLinkVerifyResult> {
  const record = await prisma.magicLinkToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.consumedAt !== null || record.expiresAt <= new Date()) {
    return { ok: false };
  }
  await prisma.magicLinkToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return { ok: true, email: record.email };
}

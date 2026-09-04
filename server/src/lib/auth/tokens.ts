import { createHash, randomBytes, randomInt } from "node:crypto";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;
export const OTP_MAX_REQUESTS_PER_WINDOW = 5;

export const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000;

export const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * sha256 is deliberate here, not argon2: every value this hashes (magic-link
 * tokens, refresh tokens) is a 256-bit random opaque token, so a fast hash
 * doesn't help an attacker — the entropy itself is the defense. OTP codes are
 * the one low-entropy exception, but they're already bounded by
 * OTP_MAX_ATTEMPTS and a short expiry, so the same fast hash is fine there too.
 */
export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

import { prisma } from "../prisma.js";
import {
  generateOtpCode,
  hashToken,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_REQUESTS_PER_WINDOW,
  OTP_REQUEST_WINDOW_MS,
} from "./tokens.js";

export async function isOtpRequestAllowed(email: string): Promise<boolean> {
  const since = new Date(Date.now() - OTP_REQUEST_WINDOW_MS);
  const count = await prisma.otpCode.count({ where: { email, createdAt: { gte: since } } });
  return count < OTP_MAX_REQUESTS_PER_WINDOW;
}

/** Returns the raw (unhashed) code to email to the user — never persisted or logged in plaintext. */
export async function createOtpCode(email: string): Promise<string> {
  const code = generateOtpCode();
  await prisma.otpCode.create({
    data: { email, codeHash: hashToken(code), expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) },
  });
  return code;
}

export type OtpVerifyResult = "valid" | "invalid";

/**
 * Verifies against the most recent unconsumed code for the email. A wrong
 * guess counts against OTP_MAX_ATTEMPTS even though it doesn't consume the
 * code outright — once the limit is hit, the code stops verifying even with
 * the right value, so a leaked/guessed-at code can't be worn down forever.
 */
export async function verifyOtpCode(email: string, code: string): Promise<OtpVerifyResult> {
  const record = await prisma.otpCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt <= new Date() || record.attempts >= OTP_MAX_ATTEMPTS) {
    return "invalid";
  }

  if (record.codeHash !== hashToken(code)) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return "invalid";
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return "valid";
}

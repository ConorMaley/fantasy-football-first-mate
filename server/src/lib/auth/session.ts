import { prisma } from "../prisma.js";
import { signAccessToken } from "./jwt.js";
import { generateOpaqueToken, hashToken, REFRESH_TOKEN_EXPIRY_MS } from "./tokens.js";

export const REFRESH_COOKIE_NAME = "first_mate_refresh_token";
export const REFRESH_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_EXPIRY_MS;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface SessionMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export async function createSession(
  userId: string,
  metadata: SessionMetadata = {},
): Promise<SessionTokens> {
  const refreshToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
      expiresAt,
    },
  });

  return { accessToken: signAccessToken(userId), refreshToken, expiresAt };
}

/** Rotates the refresh token in place. Returns null for an unknown, revoked, or expired token. */
export async function rotateSession(refreshToken: string): Promise<SessionTokens | null> {
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hashToken(refreshToken) },
  });

  if (!session || session.revokedAt !== null || session.expiresAt <= new Date()) {
    return null;
  }

  const newRefreshToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt,
      lastUsedAt: new Date(),
    },
  });

  return { accessToken: signAccessToken(session.userId), refreshToken: newRefreshToken, expiresAt };
}

export async function revokeSession(refreshToken: string): Promise<void> {
  await prisma.session.updateMany({
    where: { refreshTokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

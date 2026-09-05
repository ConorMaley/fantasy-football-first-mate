import type { OAuthProvider, User } from "@prisma/client";
import type { Request, Response } from "express";
import { Router } from "express";

import { clearAuthCookies, REFRESH_COOKIE_NAME, setAuthCookies } from "../lib/auth/cookies.js";
import { UnverifiedAccountConflictError, resolveUserForVerifiedEmail } from "../lib/auth/identity.js";
import { createMagicLinkToken, isMagicLinkRequestAllowed, verifyMagicLinkToken } from "../lib/auth/magicLink.js";
import { verifyAppleIdToken } from "../lib/auth/oauth/apple.js";
import { verifyGoogleIdToken } from "../lib/auth/oauth/google.js";
import { createOtpCode, isOtpRequestAllowed, verifyOtpCode } from "../lib/auth/otp.js";
import {
  hashPassword,
  isLockedOut,
  verifyPassword,
  WeakPasswordError,
  withFailedAttempt,
  withSuccessfulLogin,
} from "../lib/auth/password.js";
import { createSession, revokeSession, rotateSession, type SessionTokens } from "../lib/auth/session.js";
import { sendMagicLinkEmail, sendOtpEmail } from "../lib/email.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
}

function isNativePlatform(req: Request): boolean {
  return req.body?.platform === "native";
}

function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerifiedAt !== null,
  };
}

async function respondWithSession(
  req: Request,
  res: Response,
  user: User,
  statusCode: number,
): Promise<void> {
  const tokens: SessionTokens = await createSession(user.id, {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  });

  if (isNativePlatform(req)) {
    res.status(statusCode).json({
      user: serializeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return;
  }

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  res.status(statusCode).json({ user: serializeUser(user), accessToken: tokens.accessToken });
}

function extractRefreshToken(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE_NAME] ?? req.body?.refreshToken;
}

function apiBaseUrl(): string {
  return process.env.API_BASE_URL ?? "http://localhost:4000";
}

/** Reused by password-signup (to verify the new email) and the standalone magic-link request. */
async function sendMagicLink(email: string): Promise<void> {
  const token = await createMagicLinkToken(email);
  await sendMagicLinkEmail(email, `${apiBaseUrl()}/api/auth/magic-link/verify?token=${token}`);
}

// -- Password --------------------------------------------------------------

authRouter.post("/password/signup", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!email || typeof password !== "string") {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (err) {
    if (err instanceof WeakPasswordError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }

  const user = await prisma.user.create({ data: { email, passwordHash } });

  // Fire-and-forget: reuses the magic-link mechanism to verify this signup's email.
  void sendMagicLink(email);

  await respondWithSession(req, res, user, 201);
});

authRouter.post("/password/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!email || typeof password !== "string") {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const genericError = () => res.status(401).json({ error: "Invalid email or password" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    genericError();
    return;
  }

  if (isLockedOut(user)) {
    res.status(423).json({ error: "Account temporarily locked due to failed login attempts" });
    return;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await prisma.user.update({ where: { id: user.id }, data: withFailedAttempt(user) });
    genericError();
    return;
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: withSuccessfulLogin() });
  await respondWithSession(req, res, updated, 200);
});

// -- OTP ---------------------------------------------------------------

authRouter.post("/otp/request", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  if (!(await isOtpRequestAllowed(email))) {
    res.status(429).json({ error: "Too many code requests. Try again later." });
    return;
  }

  const code = await createOtpCode(email);
  void sendOtpEmail(email, code);

  res.status(202).json({ message: "Code sent" });
});

authRouter.post("/otp/verify", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = req.body?.code;
  if (!email || typeof code !== "string") {
    res.status(400).json({ error: "email and code are required" });
    return;
  }

  if ((await verifyOtpCode(email, code)) === "invalid") {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  const user = await resolveUserForVerifiedEmail({ email });
  await respondWithSession(req, res, user, 200);
});

// -- Magic link --------------------------------------------------------

authRouter.post("/magic-link/request", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  if (!(await isMagicLinkRequestAllowed(email))) {
    res.status(429).json({ error: "Too many link requests. Try again later." });
    return;
  }

  await sendMagicLink(email);
  res.status(202).json({ message: "Link sent" });
});

authRouter.get("/magic-link/verify", async (req, res) => {
  const token = req.query.token;
  if (typeof token !== "string") {
    res.status(400).json({ error: "token is required" });
    return;
  }

  const result = await verifyMagicLinkToken(token);
  if (!result.ok) {
    res.status(400).json({ error: "Invalid or expired link" });
    return;
  }

  const user = await resolveUserForVerifiedEmail({ email: result.email });
  const tokens = await createSession(user.id, {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  });
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  const clientUrl = process.env.CLIENT_APP_URL;
  if (clientUrl) {
    res.redirect(302, clientUrl);
    return;
  }
  res.status(200).json({ user: serializeUser(user), accessToken: tokens.accessToken });
});

// -- OAuth ---------------------------------------------------------------

async function handleOAuthSignIn(
  req: Request,
  res: Response,
  provider: OAuthProvider,
  verify: (idToken: string) => Promise<{ providerAccountId: string; email: string; emailVerified: boolean; name?: string }>,
): Promise<void> {
  const idToken = req.body?.idToken;
  if (typeof idToken !== "string") {
    res.status(400).json({ error: "idToken is required" });
    return;
  }

  let identity;
  try {
    identity = await verify(idToken);
  } catch {
    res.status(401).json({ error: "Invalid or expired provider token" });
    return;
  }

  if (!identity.emailVerified) {
    res.status(400).json({ error: "This provider account's email is not verified" });
    return;
  }

  try {
    const user = await resolveUserForVerifiedEmail({
      email: identity.email,
      displayName: identity.name,
      oauth: { provider, providerAccountId: identity.providerAccountId },
    });
    await respondWithSession(req, res, user, 200);
  } catch (err) {
    if (err instanceof UnverifiedAccountConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    throw err;
  }
}

authRouter.post("/oauth/google", (req, res) => handleOAuthSignIn(req, res, "GOOGLE", verifyGoogleIdToken));
authRouter.post("/oauth/apple", (req, res) => handleOAuthSignIn(req, res, "APPLE", verifyAppleIdToken));

// -- Session lifecycle -----------------------------------------------------

authRouter.post("/refresh", async (req, res) => {
  const refreshToken = extractRefreshToken(req);
  if (!refreshToken) {
    res.status(401).json({ error: "No refresh token provided" });
    return;
  }

  const tokens = await rotateSession(refreshToken);
  if (!tokens) {
    clearAuthCookies(res);
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  if (isNativePlatform(req)) {
    res.status(200).json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return;
  }

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  res.status(200).json({ accessToken: tokens.accessToken });
});

authRouter.post("/logout", async (req, res) => {
  const refreshToken = extractRefreshToken(req);
  if (refreshToken) {
    await revokeSession(refreshToken);
  }
  clearAuthCookies(res);
  res.status(200).json({ ok: true });
});

// -- Profile -----------------------------------------------------------

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.status(200).json({ user: serializeUser(user) });
});

authRouter.patch("/me", requireAuth, async (req, res) => {
  const displayName = req.body?.displayName;
  if (typeof displayName !== "string" || displayName.trim().length === 0) {
    res.status(400).json({ error: "displayName is required" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { displayName: displayName.trim() },
  });
  res.status(200).json({ user: serializeUser(user) });
});

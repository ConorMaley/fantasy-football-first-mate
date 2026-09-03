import argon2 from "argon2";

const MIN_PASSWORD_LENGTH = 8;

export class WeakPasswordError extends Error {
  constructor() {
    super(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    this.name = "WeakPasswordError";
  }
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new WeakPasswordError();
  }
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export interface LockoutState {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

/** Pure lockout policy, kept free of Prisma so it's trivially unit-testable. */
export function isLockedOut(state: LockoutState, now: Date = new Date()): boolean {
  return state.lockedUntil !== null && state.lockedUntil > now;
}

export function withFailedAttempt(state: LockoutState, now: Date = new Date()): LockoutState {
  const failedLoginAttempts = state.failedLoginAttempts + 1;
  const lockedUntil =
    failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
      ? new Date(now.getTime() + LOCKOUT_DURATION_MS)
      : state.lockedUntil;
  return { failedLoginAttempts, lockedUntil };
}

export function withSuccessfulLogin(): LockoutState {
  return { failedLoginAttempts: 0, lockedUntil: null };
}

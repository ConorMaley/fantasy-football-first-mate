import { describe, expect, it } from "vitest";

import {
  hashPassword,
  isLockedOut,
  MAX_FAILED_LOGIN_ATTEMPTS,
  verifyPassword,
  WeakPasswordError,
  withFailedAttempt,
  withSuccessfulLogin,
} from "./password.js";

describe("hashPassword / verifyPassword", () => {
  it("round-trips: verify succeeds for the correct password", async () => {
    const hash = await hashPassword("correcthorsebattery");
    await expect(verifyPassword(hash, "correcthorsebattery")).resolves.toBe(true);
  });

  it("fails closed for a wrong password", async () => {
    const hash = await hashPassword("correcthorsebattery");
    await expect(verifyPassword(hash, "wrongpassword")).resolves.toBe(false);
  });

  it("rejects passwords shorter than the minimum length", async () => {
    await expect(hashPassword("short")).rejects.toBeInstanceOf(WeakPasswordError);
  });
});

describe("lockout policy", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("is not locked out with no failed attempts", () => {
    expect(isLockedOut({ failedLoginAttempts: 0, lockedUntil: null }, now)).toBe(false);
  });

  it("increments failed attempts without locking below the threshold", () => {
    const state = withFailedAttempt({ failedLoginAttempts: 0, lockedUntil: null }, now);
    expect(state.failedLoginAttempts).toBe(1);
    expect(state.lockedUntil).toBeNull();
    expect(isLockedOut(state, now)).toBe(false);
  });

  it("locks the account once the failure threshold is hit", () => {
    let state = { failedLoginAttempts: 0, lockedUntil: null as Date | null };
    for (let i = 0; i < MAX_FAILED_LOGIN_ATTEMPTS; i++) {
      state = withFailedAttempt(state, now);
    }
    expect(state.failedLoginAttempts).toBe(MAX_FAILED_LOGIN_ATTEMPTS);
    expect(isLockedOut(state, now)).toBe(true);
  });

  it("rejects login while lockedUntil is in the future, even correctly authenticated", () => {
    const state = { failedLoginAttempts: MAX_FAILED_LOGIN_ATTEMPTS, lockedUntil: new Date(now.getTime() + 60_000) };
    expect(isLockedOut(state, now)).toBe(true);
  });

  it("is no longer locked once lockedUntil has passed", () => {
    const state = { failedLoginAttempts: MAX_FAILED_LOGIN_ATTEMPTS, lockedUntil: new Date(now.getTime() - 1) };
    expect(isLockedOut(state, now)).toBe(false);
  });

  it("resets attempts and lock on a successful login", () => {
    expect(withSuccessfulLogin()).toEqual({ failedLoginAttempts: 0, lockedUntil: null });
  });
});

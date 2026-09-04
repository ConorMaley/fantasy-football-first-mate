import { AsyncLocalStorage } from "node:async_hooks";

/// The seam standing in for real session auth. requireAuth populates this
/// per-request once a session's access token is verified; every route/service
/// below it in the middleware chain can keep calling getCurrentUserId() with
/// no changes.
const currentUserStorage = new AsyncLocalStorage<string>();

export function runWithCurrentUserId<T>(userId: string, fn: () => T): T {
  return currentUserStorage.run(userId, fn);
}

export function getCurrentUserId(): string {
  const userId = currentUserStorage.getStore();
  if (!userId) {
    throw new Error("getCurrentUserId() called outside an authenticated request");
  }
  return userId;
}

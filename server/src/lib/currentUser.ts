import { DEV_USER_EMAIL } from "./devUser.js";
import { prisma } from "./prisma.js";

/**
 * Stands in for real session/auth resolution, which is being built as a
 * separate initiative. Every route depends only on this function's return
 * value, never on how it resolves — swapping in real auth later means
 * changing only this module.
 */
let cachedUserId: string | null = null;

export async function resolveCurrentUserId(): Promise<string> {
  if (cachedUserId) {
    return cachedUserId;
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { email: DEV_USER_EMAIL } });
  cachedUserId = user.id;
  return cachedUserId;
}

export function resetCurrentUserCache(): void {
  cachedUserId = null;
}

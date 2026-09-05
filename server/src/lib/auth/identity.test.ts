import { afterEach, describe, expect, it } from "vitest";

import { cleanupEmail, uniqueEmail } from "../../test/helpers.js";
import { prisma } from "../prisma.js";
import { resolveUserForVerifiedEmail, UnverifiedAccountConflictError } from "./identity.js";

let email: string;

afterEach(async () => {
  await cleanupEmail(email);
});

describe("resolveUserForVerifiedEmail", () => {
  it("creates a new, verified User on first use", async () => {
    email = uniqueEmail("identity");
    const user = await resolveUserForVerifiedEmail({ email, displayName: "Ada" });
    expect(user.email).toBe(email);
    expect(user.displayName).toBe("Ada");
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it("reuses the existing verified User on a second call with the same email", async () => {
    email = uniqueEmail("identity");
    const first = await resolveUserForVerifiedEmail({ email });
    const second = await resolveUserForVerifiedEmail({ email });
    expect(second.id).toBe(first.id);
  });

  it("links a new OAuthAccount to an existing verified User instead of creating a duplicate", async () => {
    email = uniqueEmail("identity");
    const passwordUser = await resolveUserForVerifiedEmail({ email });

    const linked = await resolveUserForVerifiedEmail({
      email,
      oauth: { provider: "GOOGLE", providerAccountId: "google-sub-123" },
    });

    expect(linked.id).toBe(passwordUser.id);
    const account = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: "GOOGLE", providerAccountId: "google-sub-123" } },
    });
    expect(account?.userId).toBe(passwordUser.id);
  });

  it("returns the same User for a second sign-in with an already-linked OAuth account", async () => {
    email = uniqueEmail("identity");
    const first = await resolveUserForVerifiedEmail({
      email,
      oauth: { provider: "GOOGLE", providerAccountId: "google-sub-456" },
    });
    const second = await resolveUserForVerifiedEmail({
      email,
      oauth: { provider: "GOOGLE", providerAccountId: "google-sub-456" },
    });
    expect(second.id).toBe(first.id);
  });

  it("refuses to auto-link a new OAuth account onto an existing UNVERIFIED User (account-squatting guard)", async () => {
    email = uniqueEmail("identity");
    // Simulates a password signup that hasn't verified its email yet.
    await prisma.user.create({ data: { email, passwordHash: "irrelevant-for-this-test" } });

    await expect(
      resolveUserForVerifiedEmail({
        email,
        oauth: { provider: "GOOGLE", providerAccountId: "google-sub-789" },
      }),
    ).rejects.toBeInstanceOf(UnverifiedAccountConflictError);

    const account = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: "GOOGLE", providerAccountId: "google-sub-789" } },
    });
    expect(account).toBeNull();
  });

  it("verifies an existing unverified User via OTP/magic-link consumption (no OAuth involved)", async () => {
    email = uniqueEmail("identity");
    const created = await prisma.user.create({ data: { email, passwordHash: "irrelevant-for-this-test" } });
    expect(created.emailVerifiedAt).toBeNull();

    const verified = await resolveUserForVerifiedEmail({ email });
    expect(verified.id).toBe(created.id);
    expect(verified.emailVerifiedAt).not.toBeNull();
  });
});

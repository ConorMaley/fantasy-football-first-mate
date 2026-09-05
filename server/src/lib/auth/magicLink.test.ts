import { afterEach, describe, expect, it } from "vitest";

import { cleanupEmail, uniqueEmail } from "../../test/helpers.js";
import { prisma } from "../prisma.js";
import { createMagicLinkToken, isMagicLinkRequestAllowed, verifyMagicLinkToken } from "./magicLink.js";
import { OTP_MAX_REQUESTS_PER_WINDOW } from "./tokens.js";

let email: string;

afterEach(async () => {
  await cleanupEmail(email);
});

describe("createMagicLinkToken / verifyMagicLinkToken", () => {
  it("verifies successfully with the correct token and returns the email", async () => {
    email = uniqueEmail("magic");
    const token = await createMagicLinkToken(email);
    await expect(verifyMagicLinkToken(token)).resolves.toEqual({ ok: true, email });
  });

  it("rejects an unknown token", async () => {
    email = uniqueEmail("magic");
    await expect(verifyMagicLinkToken("not-a-real-token")).resolves.toEqual({ ok: false });
  });

  it("rejects reuse of an already-consumed token", async () => {
    email = uniqueEmail("magic");
    const token = await createMagicLinkToken(email);
    await expect(verifyMagicLinkToken(token)).resolves.toEqual({ ok: true, email });
    await expect(verifyMagicLinkToken(token)).resolves.toEqual({ ok: false });
  });

  it("rejects an expired token", async () => {
    email = uniqueEmail("magic");
    const token = await createMagicLinkToken(email);
    await prisma.magicLinkToken.updateMany({
      where: { email },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await expect(verifyMagicLinkToken(token)).resolves.toEqual({ ok: false });
  });
});

describe("isMagicLinkRequestAllowed", () => {
  it("allows requests under the per-window limit and blocks once exceeded", async () => {
    email = uniqueEmail("magic-rate");
    for (let i = 0; i < OTP_MAX_REQUESTS_PER_WINDOW; i++) {
      expect(await isMagicLinkRequestAllowed(email)).toBe(true);
      await createMagicLinkToken(email);
    }
    expect(await isMagicLinkRequestAllowed(email)).toBe(false);
  });
});

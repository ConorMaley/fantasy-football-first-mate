import { afterEach, describe, expect, it } from "vitest";

import { cleanupEmail, uniqueEmail } from "../../test/helpers.js";
import { prisma } from "../prisma.js";
import { createOtpCode, isOtpRequestAllowed, verifyOtpCode } from "./otp.js";
import { OTP_MAX_ATTEMPTS, OTP_MAX_REQUESTS_PER_WINDOW } from "./tokens.js";

let email: string;

afterEach(async () => {
  await cleanupEmail(email);
});

describe("createOtpCode / verifyOtpCode", () => {
  it("verifies successfully with the correct code", async () => {
    email = uniqueEmail("otp");
    const code = await createOtpCode(email);
    await expect(verifyOtpCode(email, code)).resolves.toBe("valid");
  });

  it("rejects an incorrect code", async () => {
    email = uniqueEmail("otp");
    await createOtpCode(email);
    await expect(verifyOtpCode(email, "000000")).resolves.toBe("invalid");
  });

  it("rejects reuse of an already-consumed code", async () => {
    email = uniqueEmail("otp");
    const code = await createOtpCode(email);
    await expect(verifyOtpCode(email, code)).resolves.toBe("valid");
    await expect(verifyOtpCode(email, code)).resolves.toBe("invalid");
  });

  it("rejects an expired code", async () => {
    email = uniqueEmail("otp");
    const code = await createOtpCode(email);
    await prisma.otpCode.updateMany({
      where: { email },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await expect(verifyOtpCode(email, code)).resolves.toBe("invalid");
  });

  it("rejects the correct code once the attempt limit is exceeded", async () => {
    email = uniqueEmail("otp");
    const code = await createOtpCode(email);
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
      await verifyOtpCode(email, "000000");
    }
    await expect(verifyOtpCode(email, code)).resolves.toBe("invalid");
  });
});

describe("isOtpRequestAllowed", () => {
  it("allows requests under the per-window limit and blocks once exceeded", async () => {
    email = uniqueEmail("otp-rate");
    for (let i = 0; i < OTP_MAX_REQUESTS_PER_WINDOW; i++) {
      expect(await isOtpRequestAllowed(email)).toBe(true);
      await createOtpCode(email);
    }
    expect(await isOtpRequestAllowed(email)).toBe(false);
  });
});

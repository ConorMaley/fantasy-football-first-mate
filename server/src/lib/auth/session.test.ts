import { afterEach, describe, expect, it } from "vitest";

import { cleanupEmail, uniqueEmail } from "../../test/helpers.js";
import { prisma } from "../prisma.js";
import { verifyAccessToken } from "./jwt.js";
import { createSession, revokeSession, rotateSession } from "./session.js";

let email: string;

afterEach(async () => {
  await cleanupEmail(email);
});

async function makeUser() {
  email = uniqueEmail("session");
  return prisma.user.create({ data: { email } });
}

describe("createSession", () => {
  it("persists a Session row and returns a valid access token", async () => {
    const user = await makeUser();
    const tokens = await createSession(user.id);

    expect(verifyAccessToken(tokens.accessToken).sub).toBe(user.id);

    const session = await prisma.session.findFirst({ where: { userId: user.id } });
    expect(session).not.toBeNull();
    expect(session?.revokedAt).toBeNull();
  });
});

describe("rotateSession", () => {
  it("rotates the refresh token hash and rejects the old token afterward", async () => {
    const user = await makeUser();
    const initial = await createSession(user.id);

    const rotated = await rotateSession(initial.refreshToken);
    expect(rotated).not.toBeNull();
    expect(rotated?.refreshToken).not.toBe(initial.refreshToken);
    expect(verifyAccessToken(rotated!.accessToken).sub).toBe(user.id);

    expect(await rotateSession(initial.refreshToken)).toBeNull();
  });

  it("rejects an unknown refresh token", async () => {
    expect(await rotateSession("not-a-real-refresh-token")).toBeNull();
  });

  it("rejects an expired session", async () => {
    const user = await makeUser();
    const tokens = await createSession(user.id);
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await rotateSession(tokens.refreshToken)).toBeNull();
  });
});

describe("revokeSession", () => {
  it("makes the refresh token immediately unusable", async () => {
    const user = await makeUser();
    const tokens = await createSession(user.id);

    await revokeSession(tokens.refreshToken);

    expect(await rotateSession(tokens.refreshToken)).toBeNull();
    const session = await prisma.session.findFirst({ where: { userId: user.id } });
    expect(session?.revokedAt).not.toBeNull();
  });
});

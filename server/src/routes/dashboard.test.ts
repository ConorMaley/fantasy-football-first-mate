import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { authHeaderFor } from "../test/helpers.js";
import { ALEX_EMAIL, LEAGUE_A_NAME, LEAGUE_B_NAME, LEAGUE_C_NAME } from "../../prisma/seed.js";

describe("GET /api/dashboard", () => {
  let authHeader: string;

  beforeAll(async () => {
    const alex = await prisma.user.findUniqueOrThrow({ where: { email: ALEX_EMAIL } });
    authHeader = await authHeaderFor(alex.id);
  });

  it("returns exactly the active leagues visible to the current user", async () => {
    const res = await request(app).get("/api/dashboard").set("Authorization", authHeader);
    expect(res.status).toBe(200);
    const names = (res.body.leagues as Array<{ name: string }>).map((l) => l.name).sort();
    expect(names).toEqual([LEAGUE_B_NAME, LEAGUE_A_NAME].sort());
    expect(names).not.toContain(LEAGUE_C_NAME);
  });

  it("includes platform and season for each league", async () => {
    const res = await request(app).get("/api/dashboard").set("Authorization", authHeader);
    const gauntlet = (res.body.leagues as Array<{ name: string; platform: string; season: number }>).find(
      (l) => l.name === LEAGUE_A_NAME,
    );
    expect(gauntlet).toMatchObject({ platform: "ESPN", season: 2025 });
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(401);
  });
});

import "dotenv/config";

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { runSeed } from "../../prisma/seed.js";

const serverRoot = fileURLToPath(new URL("../../", import.meta.url));

export default async function globalSetup(): Promise<() => Promise<void>> {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL must be set to run tests.");
  }

  execSync("npx prisma migrate deploy", {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: "inherit",
  });

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl }) });
  try {
    await runSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }

  return async () => {
    // No connections are held open between setup and teardown.
  };
}

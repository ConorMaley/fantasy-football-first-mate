import "dotenv/config";

import { defineConfig } from "vitest/config";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL must be set to run tests (see server/.env.example) — tests never fall back to DATABASE_URL to avoid touching dev data.",
  );
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/testSetup.ts"],
    globalSetup: ["src/test/globalSetup.ts"],
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
  },
});

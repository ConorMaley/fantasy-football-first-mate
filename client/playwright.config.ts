import { defineConfig, devices } from "@playwright/test";

const E2E_API_PORT = 4100;
const E2E_WEB_PORT = 8092;
const E2E_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/first_mate_e2e";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${E2E_WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Isolated API instance seeded from scratch against a dedicated
      // database — never touches the dev DB or the Vitest unit-test DB.
      command: "npx prisma migrate deploy && npx tsx prisma/seed.ts && npx tsx src/index.ts",
      cwd: "../server",
      url: `http://localhost:${E2E_API_PORT}/api/health`,
      env: { DATABASE_URL: E2E_DATABASE_URL, PORT: String(E2E_API_PORT) },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `npx expo start --web --port ${E2E_WEB_PORT}`,
      cwd: ".",
      url: `http://localhost:${E2E_WEB_PORT}`,
      env: { EXPO_PUBLIC_API_URL: `http://localhost:${E2E_API_PORT}/api` },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});

import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests for the Navatra news platform.
 *
 * The full stack (frontend :3000, admin :3001, backend :4000) is expected
 * to be running — normally via `docker compose up -d --build`. A global
 * setup pings /health first and fails with a clear message otherwise.
 *
 * URLs/credentials can be overridden with env vars so the same suite runs
 * against a local dev stack or a deployed environment.
 */

const ADMIN_URL = process.env.E2E_ADMIN_URL ?? "http://localhost:3001";
const PUBLIC_URL = process.env.E2E_PUBLIC_URL ?? "http://localhost:3000";
const API_URL = process.env.E2E_API_URL ?? "http://localhost:4000";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Tests share the seeded database — run serially to avoid races.
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: ADMIN_URL,
    channel: "chrome", // use the installed Chrome, no browser download needed
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
  projects: [
    { name: "critical-flow", testMatch: /critical-flow\.spec\.ts/ },
    { name: "multilingual", testMatch: /multilingual\.spec\.ts/ },
    // Gated on E2E_TELEGRAM=1 (needs the mock-Telegram stack — see
    // `npm run test:e2e:telegram`); otherwise all tests are skipped.
    { name: "telegram", testMatch: /telegram\.spec\.ts/ },
  ],
});

export { ADMIN_URL, PUBLIC_URL, API_URL };

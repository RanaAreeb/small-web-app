import { defineConfig, devices } from '@playwright/test';

const E2E_WEB_ORIGIN = process.env.E2E_WEB_ORIGIN || 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  globalSetup: './e2e/global-setup.mjs',
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: E2E_WEB_ORIGIN,
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

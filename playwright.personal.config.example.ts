import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Copy to playwright.personal.config.ts (gitignored) for local ShopVerse testing.
 * See tests/personal/README.md
 */
dotenv.config({ path: path.resolve(__dirname, '.env.player.local') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const baseURL =
  process.env.SHOPVERSE_URL ??
  process.env.NEXT_PUBLIC_SHOPVERSE_URL ??
  'https://shopverse-bugrace.vercel.app';

const sharedUse = {
  baseURL,
  trace: 'retain-on-failure' as const,
  screenshot: 'only-on-failure' as const,
  video: 'retain-on-failure' as const,
  actionTimeout: 10_000,
  navigationTimeout: 20_000,
};

export default defineConfig({
  testDir: './tests/personal',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/personal' }],
  ],
  projects: [
    {
      name: 'smoke',
      testMatch: /shopverse\.spec\.ts/,
      timeout: 60_000,
      use: { ...devices['Desktop Chrome'], ...sharedUse },
    },
    {
      name: 'discovery',
      testMatch: /shopverse-discovery\.spec\.ts/,
      timeout: 900_000,
      use: { ...devices['Desktop Chrome'], ...sharedUse },
    },
    {
      name: 'journey',
      testMatch: /shopverse-journey\.spec\.ts/,
      timeout: 180_000,
      use: { ...devices['Desktop Chrome'], ...sharedUse },
    },
  ],
});

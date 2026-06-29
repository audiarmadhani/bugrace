import type { Page } from '@playwright/test';
import { requireEnv } from './env';

export async function loginPlatform(page: Page): Promise<void> {
  const email = requireEnv('TEST_PLATFORM_EMAIL');
  const password = requireEnv('TEST_PLATFORM_PASSWORD');

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

export async function startTodaysChallenge(page: Page): Promise<void> {
  await page.goto('/challenge');
  const startButton = page.getByRole('button', { name: "Start Today's Challenge" });
  const alreadySubmitted = page.getByText('You have already submitted today');

  if (await alreadySubmitted.isVisible().catch(() => false)) {
    throw new Error(
      'Platform account already submitted today\'s challenge. Use a fresh test account or wait until tomorrow.'
    );
  }

  if (!(await startButton.isVisible().catch(() => false))) {
    throw new Error('Today\'s challenge is not open or the start button is missing.');
  }

  await startButton.click();
  await page.waitForURL('**/challenge/store/login', { timeout: 15_000 });
}

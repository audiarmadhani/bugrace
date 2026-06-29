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

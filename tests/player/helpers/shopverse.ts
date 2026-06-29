import type { Page } from '@playwright/test';

export function getShopverseUrl(): string {
  return (
    process.env.SHOPVERSE_URL ??
    process.env.NEXT_PUBLIC_SHOPVERSE_URL ??
    'http://127.0.0.1:3000'
  ).replace(/\/$/, '');
}

export async function loginShopVerse(
  page: Page,
  username = process.env.STORE_USERNAME ?? 'alice',
  password = process.env.STORE_PASSWORD ?? 'Password123'
): Promise<void> {
  const base = getShopverseUrl();
  const loginPath = base.includes('127.0.0.1') ? '/challenge/store/login' : '/login';

  await page.goto(`${base}${loginPath}`);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  const catalogPath = base.includes('127.0.0.1')
    ? '**/challenge/store/catalog'
    : '**/catalog';
  await page.waitForURL(catalogPath, { timeout: 15_000 });
}

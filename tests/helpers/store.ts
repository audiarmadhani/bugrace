import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const isLocal =
  (process.env.SHOPVERSE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? '').includes('127.0.0.1') ||
  !(process.env.SHOPVERSE_URL ?? process.env.NEXT_PUBLIC_SHOPVERSE_URL);

export function storePath(subpath: string): string {
  const clean = subpath.startsWith('/') ? subpath : `/${subpath}`;
  if (isLocal) {
    return `/challenge/store${clean === '/' ? '' : clean}`;
  }
  return clean;
}

export async function loginStore(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto(storePath('/login'));
  await expect(page.getByLabel('Username')).toBeVisible();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(`**${storePath('/catalog')}`, { timeout: 15_000 });
}

export async function submitStoreLoginWithoutClientValidation(page: Page): Promise<void> {
  await page.goto(storePath('/login'));
  await page.getByLabel('Username').fill('');
  await page.getByLabel('Password').fill('');
  await page.locator('form').evaluate((form) => {
    const el = form as HTMLFormElement;
    el.querySelectorAll('[required]').forEach((node) => node.removeAttribute('required'));
    el.requestSubmit();
  });
  await page.waitForURL(`**${storePath('/catalog')}`, { timeout: 15_000 });
}

export async function addFirstProductToCart(page: Page): Promise<void> {
  await page.goto(storePath('/catalog'));
  await page.getByRole('button', { name: 'Add to Cart' }).first().click();
}

export async function setCartItemQuantity(page: Page, quantity: number): Promise<void> {
  await page.goto(storePath('/cart'));
  const qty = page.locator('span.text-sm.w-8.text-center').first();

  while (Number((await qty.textContent()) ?? '1') < quantity) {
    await page.getByRole('button', { name: '+' }).first().click();
  }
}

export async function readGrandTotal(page: Page): Promise<number> {
  await page.goto(storePath('/cart'));
  const text = await page
    .locator('span.font-bold.text-xl.text-emerald-700')
    .textContent();
  return Number.parseFloat((text ?? '0').replace('$', ''));
}

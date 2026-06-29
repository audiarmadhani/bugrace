import type { Page } from '@playwright/test';

export async function loginStore(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  if (!page.url().includes('/challenge/store/login')) {
    await page.goto('/challenge/store/login');
  }

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/challenge/store/catalog', { timeout: 15_000 });
}

/** Bypass HTML5 `required` so server-side login bugs can be exercised. */
export async function submitStoreLoginWithoutClientValidation(page: Page): Promise<void> {
  await page.getByLabel('Username').fill('');
  await page.getByLabel('Password').fill('');
  await page.locator('form').evaluate((form) => {
    const el = form as HTMLFormElement;
    el.querySelectorAll('[required]').forEach((node) => node.removeAttribute('required'));
    el.requestSubmit();
  });
  await page.waitForURL('**/challenge/store/catalog', { timeout: 15_000 });
}

export async function addFirstProductToCart(page: Page): Promise<void> {
  await page.goto('/challenge/store/catalog');
  await page.getByRole('button', { name: 'Add to Cart' }).first().click();
}

export async function setCartItemQuantity(page: Page, quantity: number): Promise<void> {
  await page.goto('/challenge/store/cart');
  const qty = page.locator('span.text-sm.w-8.text-center').first();

  while (Number((await qty.textContent()) ?? '1') < quantity) {
    await page.getByRole('button', { name: '+' }).first().click();
  }
}

export async function readGrandTotal(page: Page): Promise<number> {
  await page.goto('/challenge/store/cart');
  const text = await page
    .locator('span.font-bold.text-xl.text-emerald-700')
    .textContent();
  return Number.parseFloat((text ?? '0').replace('$', ''));
}

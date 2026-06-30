import { expect, type Page } from '@playwright/test';

/** Catalog grid is visible and any in-flight filter transition has finished. */
export async function waitForCatalogReady(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('.grid.gap-4 h3').first()).toBeVisible({ timeout: 10_000 });

  const updating = page.getByText('Updating...');
  if (await updating.isVisible().catch(() => false)) {
    await expect(updating).toBeHidden({ timeout: 10_000 });
  }
}

/** Orders list finished loading (spinner hidden, heading visible). */
export async function waitForOrdersReady(page: Page): Promise<void> {
  await expect(page.getByText('Loading orders')).toBeHidden({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible();
}

/** Profile form is interactive (skeleton gone). */
export async function waitForProfileReady(page: Page): Promise<void> {
  await expect(page.getByText('Profile', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel('First Name')).toBeVisible();
}

/** Sonner / inline success message after a store action. */
export async function expectSuccessMessage(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.getByText(text)).toBeVisible({ timeout: 8_000 });
}

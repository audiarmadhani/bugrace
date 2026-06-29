import { test, expect } from '@playwright/test';
import { loginShopVerse } from '../helpers/shopverse';

test.describe('ShopVerse — player starter', () => {
  test('can log in and browse the catalog', async ({ page }) => {
    await loginShopVerse(page);
    await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to Cart' }).first()).toBeVisible();
  });

  test('can search products', async ({ page }) => {
    await loginShopVerse(page);
    await page.getByPlaceholder('Search products...').fill('Wireless');
    await page.waitForTimeout(500);
    await expect(page.getByText('Wireless Noise-Cancelling Headphones')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { loginShopVerse } from '../player/helpers/shopverse';

test.describe('Smoke — ShopVerse catalog', () => {
  test('can log in and open catalog', async ({ page }) => {
    await loginShopVerse(page);
    await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible();
  });
});

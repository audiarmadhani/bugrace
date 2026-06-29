import { test, expect } from '@playwright/test';
import { loginPlatform, startTodaysChallenge } from '../helpers/platform';
import { loginStore } from '../helpers/store';

test.describe('Smoke — platform to store', () => {
  test('can log in, start challenge, and open ShopVerse catalog', async ({ page }) => {
    await loginPlatform(page);
    await startTodaysChallenge(page);
    await loginStore(page, 'alice', 'Password123');

    await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to Cart' }).first()).toBeVisible();
  });
});

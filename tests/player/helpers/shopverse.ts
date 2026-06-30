import { expect, type Page } from '@playwright/test';
import { loginStore, storePath } from '../../helpers/store';

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
  await loginStore(page, username, password);
  await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible({
    timeout: 15_000,
  });
}

export { storePath };

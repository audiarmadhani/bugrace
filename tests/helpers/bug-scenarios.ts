import { expect, type Page } from '@playwright/test';
import type { BugDefinition } from '@/lib/bug-engine/types';
import { PRODUCTS } from '@/data/products';
import {
  addFirstProductToCart,
  loginStore,
  readGrandTotal,
  setCartItemQuantity,
  storePath,
  submitStoreLoginWithoutClientValidation,
} from './store';

export type BugVerifyContext = {
  page: Page;
  context: import('@playwright/test').BrowserContext;
};

export type BugScenario = {
  automated: boolean;
  manualSteps: string[];
  verify?: (ctx: BugVerifyContext) => Promise<void>;
};

function manualFromDefinition(def: BugDefinition): string[] {
  return [
    `Open ShopVerse → ${def.page}`,
    `Look for: ${def.title}`,
    `Category: ${def.category} | Severity: ${def.severity}`,
    `Hint (root cause): ${def.rootCause}`,
    `Injection point: ${def.injectionPoint}`,
  ];
}

const SCENARIOS: Partial<Record<string, BugScenario>> = {
  // --- Login ---
  LOGIN_EMPTY_CREDENTIALS_ACCEPTED: {
    automated: true,
    manualSteps: [
      'Go to ShopVerse login',
      'Submit with empty username and password',
      'Bug: login succeeds and redirects to catalog',
    ],
    async verify({ page }) {
      await page.goto(storePath('/login'));
      await submitStoreLoginWithoutClientValidation(page);
      await expect(page).toHaveURL(/\/catalog/);
    },
  },
  LOGIN_WRONG_ERROR_MESSAGE: {
    automated: true,
    manualSteps: ['Enter wrong credentials', 'Bug: error says "Network error" instead of invalid credentials'],
    async verify({ page }) {
      await page.goto(storePath('/login'));
      await page.getByLabel('Username').fill('alice');
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText('Network error')).toBeVisible();
    },
  },
  LOGIN_CASE_SENSITIVE_USERNAME: {
    automated: true,
    manualSteps: ['Login with "Alice" (capital A) and Password123', 'Bug: login fails despite valid account'],
    async verify({ page }) {
      await page.goto(storePath('/login'));
      await page.getByLabel('Username').fill('Alice');
      await page.getByLabel('Password').fill('Password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText(/Invalid username or password|Network error/)).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    },
  },
  LOGIN_PASSWORD_VISIBLE_IN_ERROR: {
    automated: true,
    manualSteps: ['Enter wrong password', 'Bug: error message includes the password you typed'],
    async verify({ page }) {
      const secret = 'SuperSecret99';
      await page.goto(storePath('/login'));
      await page.getByLabel('Username').fill('alice');
      await page.getByLabel('Password').fill(secret);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText(secret)).toBeVisible();
    },
  },
  LOGIN_REMEMBER_ME_IGNORED: {
    automated: true,
    manualSteps: [
      'Check Remember me and sign in',
      'Close the browser completely and reopen ShopVerse',
      'Bug: you are logged out despite Remember me being checked',
    ],
    async verify({ page, context }) {
      await page.goto(storePath('/login'));
      await page.getByLabel('Username').fill('alice');
      await page.getByLabel('Password').fill('Password123');
      await page.getByLabel('Remember me').check();
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(`**${storePath('/catalog')}`);

      const cookies = await context.cookies();
      const session = cookies.find((c) => c.name === 'bugrace_challenge_session');
      expect(session).toBeDefined();
      expect(session?.expires).toBeLessThan(0);
    },
  },
  LOGIN_NO_RATE_LIMITING: {
    automated: true,
    manualSteps: [
      'Submit wrong password 6+ times',
      'Bug: no lockout message (normally locks after 5 attempts)',
    ],
    async verify({ page }) {
      await page.goto(storePath('/login'));
      for (let i = 0; i < 6; i++) {
        await page.getByLabel('Username').fill('alice');
        await page.getByLabel('Password').fill('wrong');
        await page.getByRole('button', { name: 'Sign In' }).click();
      }
      await expect(page.getByText(/Too many failed attempts/)).toHaveCount(0);
      await expect(page.getByText(/Invalid username|Network error/)).toBeVisible();
    },
  },

  // --- Catalog ---
  CATALOG_SEARCH_CASE_SENSITIVE: {
    automated: true,
    manualSteps: [
      'Search "wireless" (lowercase)',
      'Bug: "Wireless Noise-Cancelling Headphones" does not appear',
    ],
    async verify({ page }) {
      await page.goto(storePath('/catalog'));
      await page.getByPlaceholder('Search products...').fill('wireless');
      await page.waitForTimeout(500);
      await expect(page.getByText('Wireless Noise-Cancelling Headphones')).toHaveCount(0);
      await page.getByPlaceholder('Search products...').fill('Wireless');
      await page.waitForTimeout(500);
      await expect(page.getByText('Wireless Noise-Cancelling Headphones')).toBeVisible();
    },
  },
  CATALOG_SORT_PRICE_INCORRECT: {
    automated: true,
    manualSteps: [
      'Sort by Price: Low to High',
      'Bug: most expensive item appears first',
    ],
    async verify({ page }) {
      const highest = [...PRODUCTS].sort((a, b) => b.price - a.price)[0]!;
      await page.goto(storePath('/catalog'));
      await page.getByRole('combobox').nth(1).click();
      await page.getByRole('option', { name: 'Price: Low to High' }).click();
      await page.waitForTimeout(500);
      const firstCard = page.locator('.grid.gap-4 h3').first();
      await expect(firstCard).toHaveText(highest.name);
    },
  },
  CATALOG_FILTER_CATEGORY_OR_LOGIC: {
    automated: true,
    manualSteps: [
      'Filter category to Clothing',
      'Bug: Electronics products also appear',
    ],
    async verify({ page }) {
      await page.goto(storePath('/catalog'));
      await page.getByRole('combobox').first().click();
      await page.getByRole('option', { name: 'Clothing' }).click();
      await page.waitForTimeout(500);
      await expect(page.getByText('Wireless Noise-Cancelling Headphones')).toBeVisible();
    },
  },
  CATALOG_DUPLICATE_PRODUCTS: {
    automated: true,
    manualSteps: ['Open catalog', 'Bug: first products appear twice in the grid'],
    async verify({ page }) {
      await page.goto(storePath('/catalog'));
      const names = await page.locator('.grid.gap-4 h3').allTextContents();
      const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
      expect(duplicates.length).toBeGreaterThan(0);
    },
  },

  // --- Cart ---
  CART_TOTAL_IGNORES_QUANTITY: {
    automated: true,
    manualSteps: [
      'Add one product, set quantity to 2',
      'Bug: Grand Total equals unit price (ignores quantity)',
    ],
    async verify({ page }) {
      await addFirstProductToCart(page);
      await setCartItemQuantity(page, 2);
      const total = await readGrandTotal(page);
      const unitPrice = PRODUCTS[0]!.price;
      expect(total).toBeCloseTo(unitPrice, 2);
      expect(total).toBeLessThan(unitPrice * 2 - 0.01);
    },
  },
  CART_SUBTOTAL_TAX_DOUBLE: {
    automated: true,
    manualSteps: ['Add item to cart', 'Bug: total is ~16% higher than line items (tax applied twice)'],
    async verify({ page }) {
      await addFirstProductToCart(page);
      const total = await readGrandTotal(page);
      const expected = PRODUCTS[0]!.price * 1.08 * 1.08;
      expect(total).toBeCloseTo(expected, 1);
    },
  },
  CART_EMPTY_CHECKOUT_ENABLED: {
    automated: false,
    manualSteps: [
      'Empty the cart',
      'Bug: checkout link still works or shows item count > 0',
      '(Check cart page checkout button / server total)',
    ],
  },

  // --- Orders ---
  ORDERS_VIEW_OTHER_USERS_ORDERS: {
    automated: true,
    manualSteps: [
      'Login as bob',
      'Open My Orders',
      'Bug: orders belonging to alice/charlie are visible',
    ],
    async verify({ page }) {
      await loginStore(page, 'bob', 'Password123');
      await page.goto(storePath('/orders'));
      await page.waitForSelector('text=Loading orders', { state: 'hidden' });
      await expect(page.getByText(/alice|charlie/i)).toBeVisible();
    },
  },
  ORDERS_STATUS_ALWAYS_PROCESSING: {
    automated: true,
    manualSteps: ['Open My Orders', 'Bug: every order shows status "Processing"'],
    async verify({ page }) {
      await loginStore(page, 'alice', 'Password123');
      await page.goto(storePath('/orders'));
      await page.waitForSelector('text=Loading orders', { state: 'hidden' });
      const processing = page.getByText('Processing', { exact: true });
      await expect(processing.first()).toBeVisible();
      const total = await processing.count();
      const orderRows = page.locator('div.space-y-3 > div');
      expect(total).toBe(await orderRows.count());
    },
  },
};

export function getBugScenario(bugId: string, definition?: BugDefinition): BugScenario {
  const known = SCENARIOS[bugId];
  if (known) return known;

  if (definition) {
    return {
      automated: false,
      manualSteps: manualFromDefinition(definition),
    };
  }

  return {
    automated: false,
    manualSteps: [
      `No scripted scenario for ${bugId}.`,
      'Use the revealed bug metadata and explore the store manually.',
    ],
  };
}

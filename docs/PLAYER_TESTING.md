# Player testing guide

Use any automation or manual tool against **ShopVerse**. Submit your bug report on **BugRace** when ready.

## URLs

| App | Purpose | Env var |
|-----|---------|---------|
| BugRace | Login, submit, leaderboard | `NEXT_PUBLIC_PLATFORM_URL` |
| ShopVerse | Find the bug (manual or automated) | `NEXT_PUBLIC_SHOPVERSE_URL` / `SHOPVERSE_URL` |

ShopVerse does **not** require a BugRace account. Store accounts:

| Username | Password |
|----------|----------|
| alice, bob, charlie | Password123 |
| admin | Password123 |

## Workflow

1. Open ShopVerse (`/login` on the store domain)
2. Test with Playwright, Cypress, DevTools, etc.
3. Log into BugRace → **Submit Bug** (`/submit-bug`)
4. Leaderboard: **accuracy score first**; if tied, **earliest submit time** wins

## Playwright (starter kit in this repo)

```bash
cp tests/player/env.example .env.player.local
# Edit SHOPVERSE_URL=https://your-shopverse-domain.com
npm run test:player
```

Interactive mode:

```bash
npx playwright test -c playwright.player.config.ts --ui
```

### Example spec

See [`tests/player/examples/catalog.spec.ts`](../tests/player/examples/catalog.spec.ts).

## Standalone Playwright (without cloning full repo)

```bash
npm init playwright@latest
```

```ts
import { test, expect } from '@playwright/test';

test('explore ShopVerse', async ({ page }) => {
  await page.goto('https://YOUR-SHOPVERSE-URL/login');
  await page.getByLabel('Username').fill('alice');
  await page.getByLabel('Password').fill('Password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible();
});
```

## Cypress (outline)

```js
cy.visit('https://YOUR-SHOPVERSE-URL/login');
cy.get('label').contains('Username').type('alice');
cy.get('label').contains('Password').type('Password123');
cy.contains('button', 'Sign In').click();
cy.url().should('include', '/catalog');
```

## QA vs player tests

| Suite | Command | Purpose |
|-------|---------|---------|
| Player | `npm run test:player` | ShopVerse only — no bug reveal |
| QA | `npm run test:bug` | Admin: reveals today's bug from DB |
| Smoke | `npm run test:e2e` | Internal smoke tests |

## In-app guide

BugRace → **Challenge** → **Automation guide** (`/challenge/testing`)

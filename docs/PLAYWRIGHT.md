# Playwright QA tests

Use these tests to **reveal today's injected bug** (from Supabase) and **verify it behaves as expected** in ShopVerse. This is for your own QA — not for players.

## What the tests do

| Test file | Purpose |
|-----------|---------|
| `tests/qa/todays-bug.spec.ts` | Fetches today's `bug_id` from `daily_challenges`, prints full metadata, then runs an automated check (or manual steps) in the store |
| `tests/smoke/platform-flow.spec.ts` | Quick sanity check: platform login → start challenge → ShopVerse catalog |

## Prerequisites

1. **Running app** — local (`npm run dev`) or deployed URL
2. **Seeded database** — today's row in `daily_challenges` with `status = OPEN` (`npm run seed`)
3. **Platform test account** — a BugRace user that has **not** submitted today's challenge yet
4. **Supabase service role key** — only used in tests to read `bug_id` (never expose to the client app)

## Setup (one time)

### 1. Install browsers

```bash
npm install
npx playwright install chromium
```

### 2. Create test env file

```bash
cp tests/env.example .env.test.local
```

Edit `.env.test.local`:

```env
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
TEST_PLATFORM_EMAIL=your-bugrace-user@example.com
TEST_PLATFORM_PASSWORD=your-password
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Against production:**

```env
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app
```

Use the same Supabase project as the deployed app.

### 3. Register a dedicated QA user (recommended)

Create a platform account only used for Playwright. If that account already submitted today's challenge, the start button is hidden and tests will fail.

## Running tests

### Reveal + verify today's bug

```bash
npm run test:bug
```

This runs `tests/qa/todays-bug.spec.ts`:

1. **Reveal** — logs and annotates today's bug ID, title, page, category, severity, root cause
2. **Verify** — logs into the platform, starts the challenge, then either:
   - runs an **automated assertion** (login, catalog, cart, orders bugs), or
   - prints **manual steps** you can follow in the browser

### Smoke test only

```bash
npm run test:e2e
```

### Interactive UI mode (debugging)

```bash
npm run test:e2e:ui
```

### App already running

Skip the dev server auto-start:

```bash
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:bug
```

### View last HTML report

```bash
npx playwright show-report
```

## Reading results

### Console output

After the reveal test, you'll see something like:

```
=== TODAY'S BUG (QA reveal) ===
Date: 2026-06-29
Status: OPEN
Bug ID: CATALOG_SEARCH_CASE_SENSITIVE
Title: Search is case-sensitive
Page: Catalog
...
```

### Automated vs manual

Roughly 15 bugs have **automated** checks in `tests/helpers/bug-scenarios.ts`. The rest fall back to manual steps derived from `data/bugs.ts`.

When automated:

- Test **passes** → the bug behavior is present in the app (injection is working)
- Test **fails** → either the wrong bug is active, injection is broken, or the UI blocks the bug (e.g. client-side validation)

When manual:

- Test **passes** but logs `manual-only` → you still get the reveal; explore the store yourself using the printed steps

## Adding automated checks for more bugs

Edit `tests/helpers/bug-scenarios.ts`:

```ts
MY_BUG_ID: {
  automated: true,
  manualSteps: ['...'],
  async verify({ page }) {
    // Playwright assertions
  },
},
```

Match the behavior in `lib/bug-engine/implementations/*.ts`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Missing TEST_PLATFORM_EMAIL` | Copy `tests/env.example` → `.env.test.local` |
| `No daily_challenges row for today` | Run `npm run seed` against your Supabase project |
| `already submitted today's challenge` | Use another platform user or wait for the next day |
| `Challenge is not open` | Check `daily_challenges.status` for today is `OPEN` |
| Login redirect fails locally | Ensure `.env.local` has valid Supabase keys and `npm run dev` is up |
| Empty login test doesn't redirect | Bug may not be `LOGIN_EMPTY_CREDENTIALS_ACCEPTED` — check reveal output |

## Security note

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Keep it in `.env.test.local` only (gitignored). Never add it to client-side env or commit it.

## npm scripts

| Script | Command |
|--------|---------|
| `npm run test:e2e` | All Playwright tests |
| `npm run test:bug` | Today's bug reveal + verify only |
| `npm run test:e2e:ui` | Playwright UI runner |

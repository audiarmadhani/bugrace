# BugRace

Gamified training platform for QA Engineers and SDETs. Find exactly one intentionally introduced bug each day in a realistic e-commerce application.

## Tech Stack

- Next.js 15 App Router
- TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Database)
- Zustand, TanStack Query, React Hook Form, Zod, date-fns

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start Supabase locally

```bash
npx supabase start
```

Apply migrations:

```bash
npx supabase db reset
```

Copy keys from `supabase start` output into `.env.local` (see `.env.example`).

### 3. Seed the database

```bash
npm run seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Challenge Store Test Accounts

| Username | Password |
|----------|----------|
| alice | Password123 |
| bob | Password123 |
| charlie | Password123 |
| admin | Password123 |

## Platform Routes

- `/login` — Platform authentication
- `/register` — Create account
- `/dashboard` — Daily overview
- `/challenge` — Start today's challenge
- `/submit-bug` — Submit bug report
- `/leaderboard` — Daily + season standings
- `/profile` — User profile
- `/history` — Past challenges

## Store Routes

- `/challenge/store/login`
- `/challenge/store/catalog`
- `/challenge/store/product/[id]`
- `/challenge/store/cart`
- `/challenge/store/checkout`
- `/challenge/store/orders`
- `/challenge/store/profile`

## Adding a New Bug

1. Add a `BugDefinition` to `data/bugs.ts`
2. Add handler to the appropriate domain file in `lib/bug-engine/implementations/`
3. Run `npm run validate:bugs`

## Scripts

- `npm run dev` — Development server
- `npm run build` — Production build
- `npm run seed` — Seed season + challenge data
- `npm run validate:bugs` — Validate bug registry

## Architecture Notes

- **Bug engine**: Registry-based with 50+ bugs, `applyInjection(activeBug, point, defaultFn, ctx)`
- **Leaderboards**: Computed dynamically from `submissions` (daily) and `season_user_points` (season)
- **Challenge status**: `OPEN` → `REVEALED` (midnight UTC cron)
- **Answer secrecy**: `bug_id`, correct answers never exposed to client while challenge is OPEN

## Deployment

**Full production guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Stack: **Supabase** (database + auth) · **Vercel** (hosting) · **cron-job.org** (midnight UTC challenge rotation)

Quick summary:

1. `npx supabase link` → `npx supabase db push` → `npm run seed`
2. Deploy to Vercel with all env vars from `.env.example`
3. Configure cron-job.org to `GET /api/cron/rotate-challenge` with `Authorization: Bearer <CRON_SECRET>` at `00:00 UTC`

# BugRace Production Deployment Guide

Deploy BugRace to production using:

- **Supabase** — PostgreSQL database + platform authentication
- **Vercel** — Next.js hosting
- **[cron-job.org](https://cron-job.org)** — Midnight UTC daily challenge rotation (replaces Vercel Cron)

Estimated time: **30–45 minutes** for a first deploy.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Supabase setup](#3-supabase-setup)
4. [Seed production data](#4-seed-production-data)
5. [GitHub repository](#5-github-repository)
6. [Vercel deployment](#6-vercel-deployment)
7. [cron-job.org setup](#7-cron-joborg-setup)
8. [Production verification](#8-production-verification)
9. [Day-2 operations](#9-day-2-operations)
10. [Troubleshooting](#10-troubleshooting)
11. [Security checklist](#11-security-checklist)

---

## 1. Architecture overview

```
Users
  │
  ├─► Vercel (Next.js app)
  │     ├─ Platform auth ──► Supabase Auth
  │     ├─ API / DB reads  ──► Supabase Postgres (anon + RLS)
  │     └─ Cron endpoint   ──► /api/cron/rotate-challenge
  │
  └─► cron-job.org (daily 00:00 UTC)
        └─ GET https://your-app.vercel.app/api/cron/rotate-challenge
           Header: Authorization: Bearer <CRON_SECRET>
```

**What the cron job does every midnight UTC:**

1. Sets yesterday's `daily_challenges` row to `REVEALED` and sets `revealed_at`
2. Ranks yesterday's submissions and awards F1 points into `season_user_points`
3. Optionally awards `user_badges` for top-3 finishers
4. Creates Season 2 automatically when Season 1 ends

---

## 2. Prerequisites


| Tool                                         | Purpose                   |
| -------------------------------------------- | ------------------------- |
| [Supabase account](https://supabase.com)     | Database + auth           |
| [Vercel account](https://vercel.com)         | App hosting               |
| [cron-job.org account](https://cron-job.org) | Free external cron        |
| [GitHub account](https://github.com)         | Source control for Vercel |
| Node.js 20+                                  | Local CLI commands        |
| Supabase CLI                                 | Push migrations           |


Install the Supabase CLI if you don't have it:

```bash
npm install -g supabase
# or use npx supabase for every command
```

---

## 3. Supabase setup

### 3.1 Create a cloud project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Choose your organization, name (e.g. `bugrace-prod`), database password, and region (pick closest to your users)
4. Wait for provisioning to finish (~2 minutes)

### 3.2 Note your project reference

Your **project ref** is in the dashboard URL:

```
https://supabase.com/dashboard/project/<project-ref>
```

Your production API URL will be:

```
https://<project-ref>.supabase.co
```

### 3.3 Link the CLI and push migrations

From the BugRace repo root:

```bash
cd /path/to/bugrace
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

This applies `[supabase/migrations/001_initial.sql](../supabase/migrations/001_initial.sql)`, which creates:

- `profiles`, `seasons`, `season_user_points`, `daily_challenges`, `submissions`
- `challenge_views`, `user_badges`
- `challenge_profiles`, `challenge_orders`, `challenge_order_items`
- RLS policies, `set_updated_at()` triggers, and the `handle_new_user` signup trigger

Verify in **Supabase → Table Editor** that tables exist.

### 3.4 Configure authentication

#### Email provider

1. Go to **Authentication → Providers → Email**
2. Ensure **Enable Email provider** is on
3. For early testing you may disable **Confirm email**; enable it before inviting real users

#### URL configuration

Go to **Authentication → URL Configuration**:


| Setting           | Value                                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| **Site URL**      | `https://your-app.vercel.app` (update after first Vercel deploy if unknown yet) |
| **Redirect URLs** | `https://your-app.vercel.app/`**                                                |
|                   | `http://localhost:3000/**` (optional, for local dev)                            |


#### Auth settings (recommended for production)

- **Authentication → Settings**: set minimum password length to 8+
- Disable public signups later via RLS or Supabase dashboard if you want invite-only access

### 3.5 Collect API keys

Go to **Project Settings → API**:


| Env variable                    | Supabase label          | Secret?                           |
| ------------------------------- | ----------------------- | --------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL             | No                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public`         | No (public by design)             |
| `SUPABASE_SERVICE_ROLE_KEY`     | `service_role` `secret` | **Yes — never expose to browser** |


---

## 4. Seed production data

The app needs Season 1 (30 daily challenges) and challenge store accounts before users can play.

### 4.1 Generate application secrets

Run three times:

```bash
openssl rand -base64 32
```

Save the output for:

- `CRON_SECRET`
- `CHALLENGE_SESSION_SECRET`

Each must be at least 32 characters.

### 4.2 Run the seed script against production

Create a temporary env file (do **not** commit this):

```bash
# .env.production.seed  (gitignored)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Run:

```bash
export $(grep -v '^#' .env.production.seed | xargs) && npm run seed
```

Expected output:

```
Seeding BugRace...
Created Season 1 with 30 daily challenges.
Seeded challenge profiles.
Seeded sample orders.
Seed complete.
```

### 4.3 Verify seed data

In **Supabase → Table Editor**:


| Table                | What to check                                 |
| -------------------- | --------------------------------------------- |
| `seasons`            | 1 row, `season_number = 1`, 30-day date range |
| `daily_challenges`   | 30 rows, today’s row has `status = OPEN`      |
| `challenge_profiles` | 4 rows: alice, bob, charlie, admin            |
| `challenge_orders`   | 4 sample orders (one per account)             |


---

## 5. GitHub repository

Push the codebase to GitHub (skip if already done):

```bash
git init
git add .
git commit -m "BugRace production ready"
git branch -M main
git remote add origin https://github.com/<your-user>/bugrace.git
git push -u origin main
```

Ensure `.env.local` and `.env.production.seed` are **not** committed (covered by `.gitignore`).

---

## 6. Vercel deployment

### 6.1 Import the project

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `.` (repo root)
5. Build command: `npm run build` (default)
6. Output directory: `.next` (default)

### 6.2 Set environment variables

Before deploying, open **Environment Variables** and add all six variables for **Production** (and Preview if you want preview deploys to work):


| Variable                        | Example / notes                           |
| ------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://abcdefgh.supabase.co`            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon key)                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJhbGci...` (service role — **secret**) |
| `CRON_SECRET`                   | Output of `openssl rand -base64 32`       |
| `CHALLENGE_SESSION_SECRET`      | Output of `openssl rand -base64 32`       |


> **Important:** Use the **same** `CRON_SECRET` in Vercel and cron-job.org (configured in the next section).

### 6.3 Deploy

Click **Deploy**. Wait for the build to finish.

Your production URL will be something like:

```
https://bugrace.vercel.app
```

### 6.4 Update Supabase auth URLs

Return to **Supabase → Authentication → URL Configuration** and set:

- **Site URL** → `https://bugrace.vercel.app`
- **Redirect URLs** → `https://bugrace.vercel.app/`**

Save changes.

### 6.5 Custom domain (optional)

In **Vercel → Project → Settings → Domains**, add your domain (e.g. `bugrace.com`).

If you use a custom domain, update Supabase redirect URLs to match.

### 6.6 Vercel Cron — not used

The repo includes `[vercel.json](../vercel.json)` with a Vercel Cron definition. **This guide uses cron-job.org instead**, which works on Vercel's free Hobby plan.

You can leave `vercel.json` as-is (Vercel Cron is ignored on Hobby) or remove the `crons` block later. Production scheduling is handled entirely by cron-job.org.

---

## 7. cron-job.org setup

### 7.1 Create an account

1. Go to [https://cron-job.org](https://cron-job.org) and sign up (free tier is sufficient)
2. Verify your email

### 7.2 Create the cron job

1. Click **Cronjobs → Create cronjob**
2. Configure:


| Field              | Value                                                    |
| ------------------ | -------------------------------------------------------- |
| **Title**          | BugRace Daily Challenge Rotation                         |
| **URL**            | `https://<your-vercel-domain>/api/cron/rotate-challenge` |
| **Schedule**       | Every day at **00:00**                                   |
| **Timezone**       | **UTC**                                                  |
| **Request method** | `GET`                                                    |
| **Enabled**        | Yes                                                      |


### 7.3 Add the authorization header

cron-job.org must send the same secret Vercel expects.

1. In the cron job editor, open **Advanced** or **Request headers**
2. Add a header:


| Header name     | Header value                |
| --------------- | --------------------------- |
| `Authorization` | `Bearer <your-CRON_SECRET>` |


Replace `<your-CRON_SECRET>` with the exact value set in Vercel env vars (including no extra spaces).

Example:

```
Authorization: Bearer k7x9mP2vQnR8sL4wY6zA1bC3dE5fG7hJ9kM0nP2qR4=
```

### 7.4 Test the cron job manually

Before waiting for midnight UTC, use **Run now** in cron-job.org (or curl):

```bash
curl -i \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://bugrace.vercel.app/api/cron/rotate-challenge
```

**Expected response:**

```json
HTTP/1.1 200 OK
{"ok":true,"processed":"2026-06-28"}
```

**If you get `401 Unauthorized`:**

- `CRON_SECRET` in Vercel does not match the header value
- Header must be exactly `Bearer <secret>` (capital B, one space)

**If you get `500`:**

- Check Vercel **Functions** logs
- Usually means `SUPABASE_SERVICE_ROLE_KEY` is missing or wrong

### 7.5 Schedule reference


| Cron expression | Meaning                |
| --------------- | ---------------------- |
| `0 0 * * `*     | Every day at 00:00 UTC |


cron-job.org UI: set **hour = 0**, **minute = 0**, **timezone = UTC**.

### 7.6 Monitoring

- cron-job.org dashboard shows last run time, HTTP status, and response body
- Enable email notifications in cron-job.org for failed jobs (recommended)
- Optionally add a second daily job at `00:05 UTC` as a backup (same URL + header)

---

## 8. Production verification

Work through this checklist after deploy:

### Platform auth

- [x] Open `https://your-app.vercel.app/register`
- [ ] Create account (e.g. `tester@yourcompany.com`)
- [ ] Confirm redirect to `/dashboard`
- [ ] Verify row in Supabase `profiles` table

### Daily challenge flow

- [ ] Dashboard shows **Season 1**, **Day X / 30**, countdown timer
- [ ] Click **Start Today's Challenge** → lands on store login
- [ ] Log in with `alice` / `Password123`
- [ ] Browse catalog, add to cart, checkout
- [ ] Submit bug report at `/submit-bug`
- [ ] Dashboard shows submission time and score (not the answer)
- [ ] Leaderboard shows your entry

### Cron (manual test)

- [ ] `curl` cron endpoint returns `200` with `{"ok":true,...}`
- [ ] cron-job.org **Run now** succeeds

### After first real midnight UTC run

- [ ] Yesterday's `daily_challenges.status` = `REVEALED`
- [ ] `revealed_at` is set on yesterday's row
- [ ] Top submitters have rows in `season_user_points`
- [ ] `/history` shows official answer for revealed days

---

## 9. Day-2 operations

### Re-seed (only on empty database)

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
npm run seed
```

The seed script skips season creation if Season 1 already exists.

### Manual challenge rotation (emergency)

If cron-job.org fails and you need to rotate immediately:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/rotate-challenge
```

### Preview deployments

Preview Vercel deploys share the **same Supabase project** if you use the same env vars. For isolated staging, create a second Supabase project and separate env vars in Vercel **Preview** environment.

### Updating the database schema

```bash
# After adding a new migration file locally:
npx supabase db push
```

### Redeploying app changes

Push to `main` — Vercel auto-deploys.

---

## 10. Troubleshooting

### Login redirect loop

**Cause:** Supabase Site URL / Redirect URLs don't match your Vercel domain.

**Fix:** Update **Authentication → URL Configuration** in Supabase.

### "No active challenge today"

**Cause:** `daily_challenges` not seeded or today's date missing.

**Fix:** Run `npm run seed` against production (see §4).

### Store login fails on production

**Cause:** `CHALLENGE_SESSION_SECRET` not set in Vercel.

**Fix:** Add env var, redeploy. Secret must be 32+ characters.

### Submissions rejected


| Symptom                  | Cause                | Fix                                        |
| ------------------------ | -------------------- | ------------------------------------------ |
| "Submissions are closed" | Challenge not `OPEN` | Check `daily_challenges.status` for today  |
| "Already submitted"      | UNIQUE constraint    | Expected — one submission per user per day |
| RLS error                | User not logged in   | Log in to platform before submitting       |


### Cron returns 401

- Verify `Authorization: Bearer <secret>` header in cron-job.org
- Verify `CRON_SECRET` in Vercel matches exactly
- Redeploy Vercel after changing env vars

### Cron returns 200 but nothing changes

- Yesterday may have no `daily_challenges` row (seed issue)
- Yesterday's challenge may already be `REVEALED`
- Check Vercel function logs for errors after the auth check

### Images not loading

Product images use `picsum.photos`. If blocked by corporate firewall, replace URLs in `[data/products.ts](../data/products.ts)` with your own CDN.

### Challenge store data missing

Re-run seed — it upserts `challenge_profiles` and only inserts orders if none exist.

---

## 11. Security checklist

Before going live with real users:

- [x] `SUPABASE_SERVICE_ROLE_KEY` is **only** in Vercel env vars (never `NEXT_PUBLIC_`)
- [x] `CRON_SECRET` is a strong random string, not the dev default
- [x] `CHALLENGE_SESSION_SECRET` is a unique production value
- [x] cron-job.org account uses a strong password + 2FA if available
- [x] Supabase **Confirm email** enabled for production signups
- [x] Supabase database password stored in a password manager
- [x] RLS enabled on all tables (done by migration)
- [x] Service role key never committed to git

---

## 12. Split deploy: BugRace + ShopVerse

Run **two Vercel projects** from the same GitHub repo — one for BugRace (platform), one for ShopVerse (store).

### Architecture

```
BugRace (APP_MODE=platform)          ShopVerse (APP_MODE=store)
NEXT_PUBLIC_SHOPVERSE_URL ──────────►  Public store URL
◄── NEXT_PUBLIC_PLATFORM_URL         Links back for submit

Both ──► Same Supabase project (daily_challenges, store data)
Cron ──► Platform project only (/api/cron/rotate-challenge)
```

### Vercel project: BugRace (platform)

| Variable | Example |
|----------|---------|
| `APP_MODE` | `platform` |
| `NEXT_PUBLIC_SHOPVERSE_URL` | `https://shop.yourdomain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role |
| `CRON_SECRET` | Random secret |
| `CHALLENGE_SESSION_SECRET` | Random secret |

### Vercel project: ShopVerse (store)

| Variable | Example |
|----------|---------|
| `APP_MODE` | `store` |
| `NEXT_PUBLIC_PLATFORM_URL` | `https://bugrace.yourdomain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (orders/profiles) |
| `CHALLENGE_SESSION_SECRET` | Same or unique per store |

**Do not** configure cron on the ShopVerse project.

### ShopVerse public paths

When `APP_MODE=store`, these URLs work:

- `/login`, `/catalog`, `/cart`, `/checkout`, `/orders`, `/profile`, `/product/:id`

### Player workflow

1. Test ShopVerse with any tool (see `docs/PLAYER_TESTING.md`)
2. Submit on BugRace → `/submit-bug`
3. Leaderboard: accuracy first, earliest `submitted_at` wins ties

### Local dev

```bash
# Both apps (default)
npm run dev

# ShopVerse only
npm run dev:store
```

---

## Quick reference

### Environment variables (all environments)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
CRON_SECRET=<random-32+-chars>
CHALLENGE_SESSION_SECRET=<random-32+-chars>
APP_MODE=platform|store
NEXT_PUBLIC_SHOPVERSE_URL=https://your-shopverse-domain.com
NEXT_PUBLIC_PLATFORM_URL=https://your-bugrace-domain.com
```

### Production URLs


| Service            | URL                                                       |
| ------------------ | --------------------------------------------------------- |
| App                | `https://<your-app>.vercel.app`                           |
| Cron endpoint      | `https://<your-app>.vercel.app/api/cron/rotate-challenge` |
| Supabase dashboard | `https://supabase.com/dashboard/project/<project-ref>`    |


### Challenge store test accounts


| Username | Password    |
| -------- | ----------- |
| alice    | Password123 |
| bob      | Password123 |
| charlie  | Password123 |
| admin    | Password123 |


### Useful commands

```bash
# Push schema to Supabase cloud
npx supabase db push

# Seed production database
export NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
npm run seed

# Validate bug registry
npm run validate:bugs

# Test cron manually
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/cron/rotate-challenge
```

---

## Support

- BugRace README: `[README.md](../README.md)`
- Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Vercel docs: [https://vercel.com/docs](https://vercel.com/docs)
- cron-job.org docs: [https://cron-job.org/en/documentation/](https://cron-job.org/en/documentation/)


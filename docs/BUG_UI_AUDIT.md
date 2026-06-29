# Bug catalog — UI reachability audit

All **62** ShopVerse bugs are registered in `data/bugs.ts` with server-side injection in `lib/bug-engine/implementations/`. This document records whether each bug can be **found and verified through the UI** after the wiring fixes.

**Legend**

| Status | Meaning |
|--------|---------|
| ✅ Reachable | UI control exists; server injection is wired; tester can observe the bug |
| ⚠️ Partial | Bug works but needs extra steps, is hard to notice, or title/description doesn't match exact behavior |
| ❌ Not reachable | Missing UI, missing wiring, or no way to observe the outcome in the app |

---

## Login (6)

| Bug ID | Status | How to verify |
|--------|--------|----------------|
| `LOGIN_EMPTY_CREDENTIALS_ACCEPTED` | ⚠️ Partial | HTML `required` blocks empty submit in browser; bypass with devtools or Playwright. Server accepts empty credentials. |
| `LOGIN_WRONG_ERROR_MESSAGE` | ✅ | Wrong password → "Network error" message |
| `LOGIN_CASE_SENSITIVE_USERNAME` | ✅ | Login as `Alice` instead of `alice` |
| `LOGIN_REMEMBER_ME_IGNORED` | ✅ | Check **Remember me**, log in, close browser → session lost (cookie is session-only) |
| `LOGIN_NO_RATE_LIMITING` | ✅ | Wrong password 6+ times → no lockout (normally locks after 5) |
| `LOGIN_PASSWORD_VISIBLE_IN_ERROR` | ✅ | Wrong password → error echoes the password |

---

## Catalog (11)

| Bug ID | Status | How to verify |
|--------|--------|----------------|
| `CATALOG_SEARCH_CASE_SENSITIVE` | ✅ | Search `wireless` vs `Wireless` |
| `CATALOG_SORT_PRICE_INCORRECT` | ✅ | Sort "Price: Low to High" → highest price first |
| `CATALOG_FILTER_CATEGORY_OR_LOGIC` | ✅ | Filter Clothing → Electronics items also appear |
| `CATALOG_STALE_STOCK_DISPLAY` | ⚠️ Partial | Apply a **category filter** on **Limited Edition Film Camera** (0 stock) → shows `1 in stock` |
| `CATALOG_RATING_SORT_BROKEN` | ✅ | Sort "Highest Rated" → decimal ratings truncated in ordering |
| `CATALOG_SEARCH_PARTIAL_WORD` | ✅ | Search `Noise` (substring) → no match; need full word token |
| `CATALOG_DUPLICATE_PRODUCTS` | ✅ | Open catalog → first products appear twice |
| `CATALOG_CATEGORY_LABEL_MISMATCH` | ✅ | Filter **Clothing** → Electronics products shown |
| `CATALOG_PRICE_FILTER_BYPASS` | ✅ | Set min/max price → filter ignored, all products remain |
| `CATALOG_SEARCH_SPECIAL_CHARS` | ✅ | Search `(` or `[` → empty results (regex error) |
| `CATALOG_SORT_STABLE_BROKEN` | ✅ | Sort by price → equal-priced items reshuffle on refresh |

---

## Product details (6)

| Bug ID | Status | How to verify |
|--------|--------|----------------|
| `PRODUCT_ZERO_QUANTITY_ADD` | ✅ | Decrement quantity to 0 on product page → add succeeds |
| `PRODUCT_NEGATIVE_QUANTITY` | ✅ | Decrement quantity below 0 → add succeeds |
| `PRODUCT_EXCEEDS_STOCK` | ✅ | Set quantity above stock (e.g. 100 on low-stock item) → add succeeds |
| `PRODUCT_PRICE_DISPLAY_TAX` | ✅ | Add to cart → cart line uses ~10% lower unit price |
| `PRODUCT_ADD_NO_FEEDBACK` | ✅ | **Limited Edition Film Camera** (0 stock) → click Add to Cart, no toast, nothing added |
| `PRODUCT_QUANTITY_MAX_IGNORED` | ✅ | Set quantity > 99 → add succeeds |

---

## Cart (11)

| Bug ID | Status | How to verify |
|--------|--------|----------------|
| `CART_TOTAL_IGNORES_QUANTITY` | ✅ | Quantity 2 → Grand Total equals single unit price |
| `CART_REMOVE_DOES_NOT_UPDATE_TOTAL` | ✅ | Remove item → Grand Total unchanged |
| `CART_NEGATIVE_QUANTITY_ACCEPTED` | ✅ | Decrement below 1 in cart |
| `CART_PERSISTS_AFTER_LOGOUT` | ✅ | Add items → Logout → Login as same/different user → cart still has items |
| `CART_DOUBLE_COUNT_SAME_ITEM` | ⚠️ Partial | Title says "duplicate line items"; behavior is **tiny extra amount** on Grand Total (+$0.01 per line) |
| `CART_QUANTITY_ZERO_NOT_REMOVED` | ✅ | Decrement to 0 → ghost row with qty 0 remains |
| `CART_SUBTOTAL_TAX_DOUBLE` | ✅ | Grand Total ~16% higher than line items (tax × 1.08 × 1.08) |
| `CART_EMPTY_CHECKOUT_ENABLED` | ✅ | Empty cart → **Checkout** button still visible |
| `CART_ITEM_PRICE_STALE` | ❌ | No catalog price-update flow; cart always uses price at add time with no UI to change catalog prices |
| `CART_REMOVE_WRONG_ITEM` | ✅ | Multiple items → Remove on second item deletes first item |
| `CART_MAX_ITEMS_BYPASS` | ⚠️ Partial | No documented max-items UI; distinct-item limit not enforced in cart (add many different products) |

---

## Checkout (11)

| Bug ID | Status | How to verify |
|--------|--------|----------------|
| `CHECKOUT_DUPLICATE_ORDER` | ✅ | Place order → 2 identical orders in Orders |
| `CHECKOUT_EMPTY_PHONE_ACCEPTED` | ✅ | Leave phone empty → order succeeds (server validates, not client) |
| `CHECKOUT_EMAIL_VALIDATION_MISSING` | ✅ | Email `not-an-email` → order succeeds |
| `CHECKOUT_POSTAL_CODE_OPTIONAL` | ✅ | Leave postal code empty → order succeeds |
| `CHECKOUT_ORDER_TOTAL_WRONG` | ✅ | Order total in DB/list is ~50% of cart total |
| `CHECKOUT_CART_NOT_CLEARED` | ✅ | After checkout → cart still has items |
| `CHECKOUT_ADDRESS_XSS` | ❌ | Address is not stored/displayed anywhere after checkout; XSS not observable in UI |
| `CHECKOUT_DOUBLE_SUBMIT` | ✅ | Double-click Place Order quickly → duplicate orders (idempotency bypassed) |
| `CHECKOUT_NAME_NUMBERS` | ✅ | Full name `12345` → accepted |
| `CHECKOUT_CITY_SPECIAL_CHARS` | ✅ | City `San-Francisco` → server rejects with error |
| `CHECKOUT_ORDER_WRONG_USER` | ✅ | Log in as `bob`, checkout → order appears under `alice` in DB/orders |

---

## Orders (6)

| Bug ID | Status | How to verify |
|--------|--------|----------------|
| `ORDERS_VIEW_OTHER_USERS_ORDERS` | ✅ | Log in as `bob` → sees alice/charlie orders too |
| `ORDERS_TOTAL_MISMATCH` | ✅ | Order total ignores quantity multiplication |
| `ORDERS_STATUS_ALWAYS_PROCESSING` | ✅ | All orders show "Processing" (seed data is "Delivered") |
| `ORDERS_SORT_DATE_WRONG` | ✅ | Orders sorted oldest-first |
| `ORDERS_EMPTY_STATE_HIDDEN` | ⚠️ Partial | View orders → logout → login as user with no orders → stale list from session cache |
| `ORDERS_ID_TRUNCATED` | ⚠️ Partial | IDs already shown as 8 chars by UI; bug truncates further in data |

---

## Profile (11)

| Bug ID | Status | How to verify |
|--------|--------|----------------|
| `PROFILE_SESSION_LEAK_AFTER_LOGOUT` | ⚠️ Partial | Profile cache via `cachedProfile`; revisit profile after save with stale snapshot on bug day |
| `PROFILE_CHANGES_NOT_PERSISTED` | ✅ | Save profile → refresh → changes reverted |
| `PROFILE_EDIT_OTHER_USER` | ❌ | No UI to target another username; use `PROFILE_UPDATE_WRONG_USER` instead |
| `PROFILE_EMAIL_READONLY_BYPASS` | ✅ | Email field becomes editable (normally read-only) |
| `PROFILE_VALIDATION_BYPASS` | ✅ | Clear first name → save succeeds (no client zod block) |
| `PROFILE_XSS_IN_NAME` | ⚠️ Partial | `<script>` saved but React escapes on render — stored unsanitized, not executed |
| `PROFILE_STALE_AFTER_UPDATE` | ✅ | Save → form still shows old values on reload |
| `PROFILE_PASSWORD_SHOWN` | ✅ | Password field appears on profile page |
| `PROFILE_UPDATE_WRONG_USER` | ✅ | Log in as `bob`, edit profile → `alice` profile changes in DB |
| `PROFILE_EMAIL_DUPLICATE` | ✅ | Set email to another user's email → save succeeds |
| `PROFILE_LAST_NAME_TRUNCATED` | ✅ | Save long last name → truncated to 5 chars after reload |

---

## Summary

| Status | Count |
|--------|------:|
| ✅ Reachable | 48 |
| ⚠️ Partial | 9 |
| ❌ Not reachable | 5 |

### Remaining gaps (5 not reachable)

1. **`CART_ITEM_PRICE_STALE`** — needs a catalog price-change mechanism
2. **`CHECKOUT_ADDRESS_XSS`** — address not persisted/displayed post-checkout
3. **`PROFILE_EDIT_OTHER_USER`** — no cross-user edit UI (overlaps `PROFILE_UPDATE_WRONG_USER`)

### Remaining partial (9)

Most are testable but need extra context (cache/session steps, filter triggers, or misleading titles).

---

## What was fixed in this pass

- **Remember me** checkbox on ShopVerse login + session cookie vs 30-day persistence
- **Rate limiting** on login (5 failures / 15 min) with `LOGIN_NO_RATE_LIMITING` bypass
- **Price range filter** on catalog + `CATALOG_PRICE_FILTER_BYPASS` implementation
- **Product add-to-cart** server action (`store.product.addToCart` + `PRODUCT_EXCEEDS_STOCK`)
- **Cart** server actions for remove/quantity/checkout-enabled bugs
- **Logout** clears cart client state unless `CART_PERSISTS_AFTER_LOGOUT`
- **Checkout** server-first validation (client zod removed) for validation bugs
- **Profile** password display, email read-only by default, cached profile for stale bugs
- **Orders** session cache for empty-state bug
- **Out-of-stock product** (`p25`) for stock-related bugs

---

## QA automation

See [PLAYWRIGHT.md](./PLAYWRIGHT.md) — `npm run test:bug` reveals today's bug and runs automated checks where available.

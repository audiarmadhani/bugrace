/** Playwright cookie expires is Unix seconds; session cookies use -1 or 0. */
export function isPersistentShopverseCookie(cookie: { expires: number }): boolean {
  const nowSec = Math.floor(Date.now() / 1000);
  if (cookie.expires <= 0) return false;
  return cookie.expires - nowSec > 60 * 60 * 24 * 7;
}

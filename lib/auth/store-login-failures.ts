import { cookies } from 'next/headers';

const COOKIE_NAME = 'bugrace_store_login_fails';
const MAX_AGE_SECONDS = 60 * 15;

export async function getStoreLoginFailCount(): Promise<number> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  const parsed = Number.parseInt(raw ?? '0', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function incrementStoreLoginFails(): Promise<void> {
  const cookieStore = await cookies();
  const next = (await getStoreLoginFailCount()) + 1;
  cookieStore.set(COOKIE_NAME, String(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearStoreLoginFails(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const STORE_LOGIN_RATE_LIMIT = 5;

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'bugrace_challenge_session';
export const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30;

export type ChallengeSession = {
  username: string;
  role: 'customer' | 'admin';
};

function getSecret() {
  const secret = process.env.CHALLENGE_SESSION_SECRET ?? 'dev-challenge-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function setChallengeSession(
  session: ChallengeSession,
  options?: { maxAge?: number }
) {
  const maxAge = options?.maxAge;
  const expiresIn = maxAge ? `${maxAge}s` : '8h';

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  });
}

export async function getChallengeSession(): Promise<ChallengeSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      username: payload.username as string,
      role: payload.role as 'customer' | 'admin',
    };
  } catch {
    return null;
  }
}

export async function clearChallengeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

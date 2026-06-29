import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'bugrace_challenge_start';

export type ChallengeStartPayload = {
  challengeId: string;
  startedAt: string;
};

function getSecret() {
  const secret =
    process.env.CHALLENGE_START_COOKIE_SECRET ?? 'dev-start-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function setChallengeStartCookie(payload: ChallengeStartPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}

export async function getChallengeStartCookie(): Promise<ChallengeStartPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      challengeId: payload.challengeId as string,
      startedAt: payload.startedAt as string,
    };
  } catch {
    return null;
  }
}

export async function clearChallengeStartCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

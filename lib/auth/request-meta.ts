import { createHash } from 'crypto';
import { headers } from 'next/headers';

export async function hashIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  return createHash('sha256').update(ip).digest('hex');
}

export async function getUserAgent(): Promise<string> {
  const h = await headers();
  return h.get('user-agent') ?? 'unknown';
}

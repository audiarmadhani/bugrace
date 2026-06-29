import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';

export async function recordChallengeView(
  userId: string,
  dailyChallengeId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase.from('challenge_views').insert({
    user_id: userId,
    daily_challenge_id: dailyChallengeId,
  });
}

export async function getDailyActiveTesters(date: Date): Promise<number> {
  const admin = createAdminClient();
  const dateStr = date.toISOString().slice(0, 10);
  const { count } = await admin
    .from('challenge_views')
    .select('user_id', { count: 'exact', head: true })
    .gte('opened_at', `${dateStr}T00:00:00Z`)
    .lte('opened_at', `${dateStr}T23:59:59Z`);
  return count ?? 0;
}

export async function getCompletionRate(dailyChallengeId: string): Promise<number> {
  const admin = createAdminClient();
  const { count: views } = await admin
    .from('challenge_views')
    .select('*', { count: 'exact', head: true })
    .eq('daily_challenge_id', dailyChallengeId);
  const { count: subs } = await admin
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('daily_challenge_id', dailyChallengeId);
  if (!views || views === 0) return 0;
  return (subs ?? 0) / views;
}

export async function getAverageSolveTime(
  dailyChallengeId: string
): Promise<number | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('submissions')
    .select('submission_duration_seconds')
    .eq('daily_challenge_id', dailyChallengeId)
    .not('submission_duration_seconds', 'is', null);

  if (!data?.length) return null;
  const sum = data.reduce((acc, r) => acc + (r.submission_duration_seconds ?? 0), 0);
  return Math.round(sum / data.length);
}

export async function getFastestBugHunter(
  dailyChallengeId: string
): Promise<{ userId: string; seconds: number } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('submissions')
    .select('user_id, submission_duration_seconds')
    .eq('daily_challenge_id', dailyChallengeId)
    .not('submission_duration_seconds', 'is', null)
    .order('submission_duration_seconds', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.submission_duration_seconds) return null;
  return { userId: data.user_id, seconds: data.submission_duration_seconds };
}

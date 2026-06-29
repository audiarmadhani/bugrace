import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { calculateAccuracyScore } from '@/lib/scoring';
import { getChallengeStartCookie } from '@/lib/auth/challenge-start-cookie';
import { hashIp, getUserAgent } from '@/lib/auth/request-meta';
import { getUserDailyRank } from '@/services/leaderboard-service';
import type { BugCategory, BugPage, BugSeverity } from '@/lib/bug-engine/types';
import type { SubmissionResult } from '@/types';

export type SubmitBugInput = {
  pageFound: BugPage;
  category: BugCategory;
  severity: BugSeverity;
  description: string;
};

export async function createSubmission(
  userId: string,
  input: SubmitBugInput
): Promise<SubmissionResult> {
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('challenge_date', new Date().toISOString().slice(0, 10))
    .maybeSingle();

  if (!challenge) {
    return { success: false, error: 'No active challenge today.' };
  }

  if (challenge.status !== 'OPEN') {
    return { success: false, error: 'Submissions are closed for today.' };
  }

  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', userId)
    .eq('daily_challenge_id', challenge.id)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: 'You have already submitted today\'s challenge. Come back tomorrow.',
    };
  }

  const score = calculateAccuracyScore(input, {
    correctPage: challenge.correct_page,
    correctCategory: challenge.correct_category,
    correctSeverity: challenge.correct_severity,
  });

  const startCookie = await getChallengeStartCookie();
  const submittedAt = new Date();
  let startedAt: string | null = null;
  let durationSeconds: number | null = null;

  if (startCookie && startCookie.challengeId === challenge.id) {
    startedAt = startCookie.startedAt;
    durationSeconds = Math.floor(
      (submittedAt.getTime() - new Date(startCookie.startedAt).getTime()) / 1000
    );
  }

  const ipHash = await hashIp();
  const userAgent = await getUserAgent();

  const { error } = await supabase.from('submissions').insert({
    user_id: userId,
    daily_challenge_id: challenge.id,
    page_found: input.pageFound,
    category: input.category,
    severity: input.severity,
    description: input.description,
    accuracy_score: score,
    started_at: startedAt,
    submitted_at: submittedAt.toISOString(),
    submission_duration_seconds: durationSeconds,
    ip_hash: ipHash,
    user_agent: userAgent,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const rank = await getUserDailyRank(challenge.id, userId);
  return { success: true, score, rank: rank ?? undefined };
}

export async function getUserTodaySubmission(userId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: challenge } = await supabase
    .from('daily_challenges')
    .select('id')
    .eq('challenge_date', today)
    .maybeSingle();

  if (!challenge) return null;

  const { data } = await supabase
    .from('submissions')
    .select('submitted_at, accuracy_score')
    .eq('user_id', userId)
    .eq('daily_challenge_id', challenge.id)
    .maybeSingle();

  return data;
}

export async function awardSeasonPoints(
  seasonId: string,
  userId: string,
  points: number
) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('season_user_points')
    .select('points')
    .eq('season_id', seasonId)
    .eq('user_id', userId)
    .maybeSingle();

  const newPoints = (existing?.points ?? 0) + points;
  await admin.from('season_user_points').upsert(
    { season_id: seasonId, user_id: userId, points: newPoints },
    { onConflict: 'season_id,user_id' }
  );
}

import { format } from 'date-fns';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import type { RevealedDailyChallenge, SafeDailyChallenge } from '@/types';
import { differenceInCalendarDays } from 'date-fns';

type DailyChallengeRow = {
  id: string;
  season_id: string;
  challenge_date: string;
  bug_id: string;
  bug_title: string;
  correct_page: string;
  correct_category: string;
  correct_severity: string;
  root_cause: string;
  status: 'OPEN' | 'REVEALED';
  revealed_at: string | null;
  seasons: { season_number: number; start_date: string } | null;
};

function toSafeChallenge(row: DailyChallengeRow): SafeDailyChallenge {
  const seasonStart = row.seasons?.start_date ?? row.challenge_date;
  const dayNumber =
    differenceInCalendarDays(new Date(row.challenge_date), new Date(seasonStart)) + 1;
  return {
    id: row.id,
    seasonId: row.season_id,
    challengeDate: row.challenge_date,
    status: row.status,
    revealedAt: row.revealed_at,
    dayNumber,
    seasonNumber: row.seasons?.season_number ?? 1,
  };
}

export async function getTodayChallengeSafe(): Promise<SafeDailyChallenge | null> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_challenges')
    .select('id, season_id, challenge_date, status, revealed_at, seasons(season_number, start_date)')
    .eq('challenge_date', today)
    .maybeSingle();

  if (!data) return null;
  return toSafeChallenge(data as unknown as DailyChallengeRow);
}

export async function getTodayBugId(): Promise<string | null> {
  const today = format(new Date(), 'yyyy-MM-dd');
  // ShopVerse uses challenge-session cookies, not Supabase auth — anon RLS would hide today's row.
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('daily_challenges')
    .select('bug_id, status')
    .eq('challenge_date', today)
    .maybeSingle();

  if (!data || data.status !== 'OPEN') return null;
  return data.bug_id as string;
}

export async function getTodayChallengeForScoring() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('challenge_date', today)
    .maybeSingle();
  return data;
}

export async function getChallengeHistory(userId: string) {
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      accuracy_score,
      submitted_at,
      daily_challenge_id,
      daily_challenges (
        challenge_date,
        status,
        bug_title,
        correct_page,
        correct_category,
        correct_severity,
        root_cause,
        revealed_at,
        seasons (season_number)
      )
    `)
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });

  return submissions ?? [];
}

export async function getRevealedChallenge(
  challengeId: string
): Promise<RevealedDailyChallenge | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_challenges')
    .select('*, seasons(season_number, start_date)')
    .eq('id', challengeId)
    .eq('status', 'REVEALED')
    .maybeSingle();

  if (!data) return null;
  const safe = toSafeChallenge(data as unknown as DailyChallengeRow);
  return {
    ...safe,
    bugTitle: data.bug_title,
    correctPage: data.correct_page,
    correctCategory: data.correct_category,
    correctSeverity: data.correct_severity,
    rootCause: data.root_cause,
  };
}

export async function getCurrentSeason() {
  const supabase = await createClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .lte('start_date', today)
    .gte('end_date', today)
    .maybeSingle();
  return data;
}

export async function ensureTodayChallenge(): Promise<void> {
  const existing = await getTodayChallengeSafe();
  if (existing) return;

  const admin = createAdminClient();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const { data: season } = await admin
    .from('seasons')
    .select('id')
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)
    .maybeSingle();

  if (!season) return;

  const { data: challenge } = await admin
    .from('daily_challenges')
    .select('id')
    .eq('challenge_date', todayStr)
    .maybeSingle();

  if (!challenge) {
    console.warn(`No challenge found for ${todayStr}`);
  }
}

import { createClient } from '@/lib/db/server';
import { getF1Points } from '@/lib/constants';

export type DailyLeaderboardEntry = {
  userId: string;
  username: string;
  accuracyScore: number;
  submittedAt: string;
  rank: number;
  f1Points: number;
};

export async function getDailyLeaderboard(
  dailyChallengeId: string,
  limit = 10
): Promise<DailyLeaderboardEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('submissions')
    .select('user_id, accuracy_score, submitted_at, profiles(username)')
    .eq('daily_challenge_id', dailyChallengeId)
    .order('accuracy_score', { ascending: false })
    .order('submitted_at', { ascending: true })
    .limit(limit);

  return (data ?? []).map((row, index) => {
    const rank = index + 1;
    const profile = row.profiles as unknown as { username: string } | null;
    return {
      userId: row.user_id,
      username: profile?.username ?? 'Unknown',
      accuracyScore: row.accuracy_score,
      submittedAt: row.submitted_at,
      rank,
      f1Points: getF1Points(rank),
    };
  });
}

export type SeasonLeaderboardEntry = {
  userId: string;
  username: string;
  points: number;
  rank: number;
};

export async function getSeasonLeaderboard(
  seasonId: string
): Promise<SeasonLeaderboardEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('season_user_points')
    .select('user_id, points, profiles(username)')
    .eq('season_id', seasonId)
    .order('points', { ascending: false });

  return (data ?? []).map((row, index) => {
    const profile = row.profiles as unknown as { username: string } | null;
    return {
      userId: row.user_id,
      username: profile?.username ?? 'Unknown',
      points: row.points,
      rank: index + 1,
    };
  });
}

export async function getUserSeasonRank(
  seasonId: string,
  userId: string
): Promise<{ rank: number; points: number } | null> {
  const leaderboard = await getSeasonLeaderboard(seasonId);
  const entry = leaderboard.find((e) => e.userId === userId);
  if (!entry) return { rank: leaderboard.length + 1, points: 0 };
  return { rank: entry.rank, points: entry.points };
}

export async function getUserDailyRank(
  dailyChallengeId: string,
  userId: string
): Promise<number | null> {
  const leaderboard = await getDailyLeaderboard(dailyChallengeId, 1000);
  const entry = leaderboard.find((e) => e.userId === userId);
  return entry?.rank ?? null;
}

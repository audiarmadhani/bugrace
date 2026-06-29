import Link from 'next/link';
import { createClient } from '@/lib/db/server';
import { ensureTodayChallenge, getTodayChallengeSafe, getCurrentSeason } from '@/lib/db/queries/challenges';
import { getDailyLeaderboard, getUserSeasonRank } from '@/services/leaderboard-service';
import { getUserTodaySubmission } from '@/services/submission-service';
import { CountdownTimer } from '@/components/platform/CountdownTimer';
import { LeaderboardTable } from '@/components/platform/LeaderboardTable';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEASON_LENGTH_DAYS } from '@/lib/constants';
import { format } from 'date-fns';

export default async function DashboardPage() {
  await ensureTodayChallenge();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const challenge = await getTodayChallengeSafe();
  const season = await getCurrentSeason();
  const submission = user ? await getUserTodaySubmission(user.id) : null;
  const dailyLeaderboard = challenge
    ? await getDailyLeaderboard(challenge.id)
    : [];
  const seasonRank =
    user && season
      ? await getUserSeasonRank(season.id, user.id)
      : null;

  const { data: profile } = user
    ? await supabase.from('profiles').select('username').eq('id', user.id).single()
    : { data: null };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.username ?? 'Racer'}
        </h1>
        <p className="text-muted-foreground mt-1">Your daily QA challenge awaits.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Season</CardDescription>
            <CardTitle className="text-3xl">Season {challenge?.seasonNumber ?? season?.season_number ?? 1}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Day</CardDescription>
            <CardTitle className="text-3xl">
              Day {challenge?.dayNumber ?? 1} / {SEASON_LENGTH_DAYS}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Next Challenge In</CardDescription>
            <CardContent className="p-0 pt-2">
              <CountdownTimer />
            </CardContent>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Season Rank</CardDescription>
            <CardTitle className="text-3xl">
              #{seasonRank?.rank ?? '—'}{' '}
              <span className="text-base font-normal text-muted-foreground">
                ({seasonRank?.points ?? 0} pts)
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Status</CardTitle>
            <CardDescription>Your submission for today&apos;s challenge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission ? (
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Submitted</Badge>
                <span className="text-sm text-muted-foreground">
                  at {format(new Date(submission.submitted_at), 'HH:mm')} UTC — Score:{' '}
                  {submission.accuracy_score}/25
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Badge>Not Submitted Yet</Badge>
              </div>
            )}

            {submission ? (
              <p className="text-sm text-muted-foreground">
                You have already submitted today&apos;s challenge.
              </p>
            ) : challenge?.status === 'OPEN' ? (
              <Link
                href="/challenge"
                className={buttonVariants({ className: 'bg-red-600 hover:bg-red-700 text-white' })}
              >
                Start Today&apos;s Challenge
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Today&apos;s challenge is not open.</p>
            )}

            {!submission && challenge?.status === 'OPEN' && (
              <Link
                href="/submit-bug"
                className={buttonVariants({ variant: 'outline' })}
              >
                Submit Bug Report
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Leaderboard</CardTitle>
            <CardDescription>Top 10 testers today</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardTable
              entries={dailyLeaderboard}
              highlightUserId={user?.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

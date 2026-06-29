import { getTodayChallengeSafe, getCurrentSeason } from '@/lib/db/queries/challenges';
import { getDailyLeaderboard, getSeasonLeaderboard } from '@/services/leaderboard-service';
import { createClient } from '@/lib/db/server';
import { LeaderboardTable } from '@/components/platform/LeaderboardTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default async function LeaderboardPage() {
  const challenge = await getTodayChallengeSafe();
  const season = await getCurrentSeason();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const daily = challenge ? await getDailyLeaderboard(challenge.id) : [];
  const seasonBoard = season ? await getSeasonLeaderboard(season.id) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Formula 1 style daily and season standings.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Leaderboard</CardTitle>
            <CardDescription>
              Ranked by accuracy score. Same score? Earlier submission wins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardTable entries={daily} highlightUserId={user?.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Season {season?.season_number ?? 1} Standings</CardTitle>
            <CardDescription>Cumulative F1 points this season</CardDescription>
          </CardHeader>
          <CardContent>
            {seasonBoard.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No season points yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Tester</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasonBoard.map((entry) => (
                    <TableRow
                      key={entry.userId}
                      className={entry.userId === user?.id ? 'bg-accent/50' : ''}
                    >
                      <TableCell>
                        <Badge variant={entry.rank <= 3 ? 'default' : 'secondary'}>
                          P{entry.rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{entry.username}</TableCell>
                      <TableCell className="text-right font-mono">{entry.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/db/server';
import { getChallengeHistory } from '@/lib/db/queries/challenges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const history = await getChallengeHistory(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Challenge History</h1>
        <p className="text-muted-foreground mt-1">Your past submissions and revealed answers.</p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No submissions yet. Complete a challenge to see your history.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => {
            const challenge = entry.daily_challenges as unknown as {
              challenge_date: string;
              status: string;
              bug_title?: string;
              correct_category?: string;
              correct_severity?: string;
              root_cause?: string;
              seasons?: { season_number: number };
            } | null;
            const revealed = challenge?.status === 'REVEALED';

            return (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg">
                      {challenge?.challenge_date
                        ? format(new Date(challenge.challenge_date), 'MMM d, yyyy')
                        : 'Unknown date'}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Season {challenge?.seasons?.season_number ?? 1}
                      </Badge>
                      <Badge>{entry.accuracy_score}/25</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Category submitted — see score above
                  </CardDescription>
                </CardHeader>
                {revealed && challenge && (
                  <CardContent className="border-t pt-4 space-y-2 text-sm">
                    <p className="font-semibold text-red-600">Official Answer</p>
                    <p><strong>Bug:</strong> {challenge.bug_title}</p>
                    <p><strong>Category:</strong> {challenge.correct_category}</p>
                    <p><strong>Severity:</strong> {challenge.correct_severity}</p>
                    <p><strong>Root Cause:</strong> {challenge.root_cause}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

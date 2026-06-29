import Link from 'next/link';
import { getTodayChallengeSafe } from '@/lib/db/queries/challenges';
import { startChallengeAction } from '@/app/actions/platform';
import { getUserTodaySubmission } from '@/services/submission-service';
import { createClient } from '@/lib/db/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEASON_LENGTH_DAYS } from '@/lib/constants';

export default async function ChallengePage() {
  const challenge = await getTodayChallengeSafe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const submission = user ? await getUserTodaySubmission(user.id) : null;

  const customers = ['alice', 'bob', 'charlie'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Today&apos;s Challenge</h1>
        <p className="text-muted-foreground mt-1">Enter the test application and find the bug.</p>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-600">Season {challenge?.seasonNumber ?? 1}</Badge>
            <Badge variant="outline">
              Day {challenge?.dayNumber ?? 1} of {SEASON_LENGTH_DAYS}
            </Badge>
          </div>
          <CardTitle className="mt-4">Find the Bug</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Exactly <strong>ONE</strong> bug exists in today&apos;s application. Find it.
            No hints. No release notes. No bug category shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-2">Customer Accounts</p>
              {customers.map((name) => (
                <p key={name} className="font-mono text-muted-foreground">
                  {name} / Password123
                </p>
              ))}
            </div>
            <div>
              <p className="font-semibold mb-2">Admin Account</p>
              <p className="font-mono text-muted-foreground">admin / Password123</p>
            </div>
          </div>

          {submission ? (
            <p className="text-sm text-muted-foreground">
              You have already submitted today&apos;s challenge.{' '}
              <Link href="/dashboard" className="text-red-600 hover:underline">
                Back to dashboard
              </Link>
            </p>
          ) : challenge?.status === 'OPEN' ? (
            <form action={startChallengeAction}>
              <input type="hidden" name="challengeId" value={challenge.id} />
              <Button type="submit" size="lg" className="w-full bg-red-600 hover:bg-red-700">
                Start Today&apos;s Challenge
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Challenge is not currently open.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

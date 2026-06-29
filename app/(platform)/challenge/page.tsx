import Link from 'next/link';
import { getTodayChallengeSafe } from '@/lib/db/queries/challenges';
import { getUserTodaySubmission } from '@/services/submission-service';
import { recordChallengeView } from '@/services/analytics-service';
import { createClient } from '@/lib/db/server';
import { getShopverseUrl } from '@/lib/config/app';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEASON_LENGTH_DAYS } from '@/lib/constants';
import { ExternalLink } from 'lucide-react';

export default async function ChallengePage() {
  const challenge = await getTodayChallengeSafe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const submission = user ? await getUserTodaySubmission(user.id) : null;
  const shopverseUrl = getShopverseUrl();

  if (user && challenge?.id) {
    await recordChallengeView(user.id, challenge.id);
  }

  const customers = ['alice', 'bob', 'charlie'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Today&apos;s Challenge</h1>
        <p className="text-muted-foreground mt-1">
          Test ShopVerse, then submit your findings on BugRace.
        </p>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-600">Season {challenge?.seasonNumber ?? 1}</Badge>
            <Badge variant="outline">
              Day {challenge?.dayNumber ?? 1} of {SEASON_LENGTH_DAYS}
            </Badge>
          </div>
          <CardTitle className="mt-4">Find the Bug in ShopVerse</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Exactly <strong>ONE</strong> bug exists in today&apos;s ShopVerse build. Find it using
            manual testing, Playwright, or any tool you prefer — then submit on{' '}
            <Link href="/submit-bug" className="text-red-600 hover:underline">
              Submit Bug
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-2">ShopVerse URL</p>
              <p className="font-mono text-muted-foreground break-all">{shopverseUrl}</p>
            </div>
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
            <div className="space-y-3">
              <a
                href={shopverseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  size: 'lg',
                  className: 'w-full bg-red-600 hover:bg-red-700 text-white',
                })}
              >
                Open ShopVerse
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
              <p className="text-xs text-muted-foreground text-center">
                Same score? Earlier submission ranks higher on the leaderboard.
              </p>
              <p className="text-sm text-center">
                <Link href="/challenge/testing" className="text-red-600 hover:underline">
                  Automation guide (Playwright &amp; more)
                </Link>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Challenge is not currently open.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

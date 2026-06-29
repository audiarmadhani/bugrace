import Link from 'next/link';
import { getPlatformUrl } from '@/lib/config/app';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ChallengeClosed() {
  const platformUrl = getPlatformUrl();

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Challenge closed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Today&apos;s ShopVerse challenge is not open right now.</p>
          <Link
            href={`${platformUrl}/challenge`}
            className={buttonVariants({ variant: 'outline' })}
          >
            Back to BugRace
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

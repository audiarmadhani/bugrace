import Link from 'next/link';
import { getShopverseUrl } from '@/lib/config/app';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export default function ChallengeTestingPage() {
  const shopverseUrl = getShopverseUrl();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/challenge" className="text-sm text-red-600 hover:underline">
          ← Back to challenge
        </Link>
        <h1 className="text-3xl font-bold mt-2">Automation Guide</h1>
        <p className="text-muted-foreground mt-1">
          Use Playwright, Cypress, or any tool against ShopVerse. Submit findings on BugRace when
          ready.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Two apps, one challenge</CardTitle>
          <CardDescription>
            ShopVerse is a separate URL. BugRace is only for login and submit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Open ShopVerse and test with your tools</li>
            <li>Return to BugRace → Submit Bug when you find the issue</li>
            <li>Leaderboard: higher accuracy wins; ties go to earliest submit time</li>
          </ol>
          <a
            href={shopverseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants()}
          >
            Open ShopVerse
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Playwright (included in repo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto">
          <p className="font-sans text-muted-foreground font-normal mb-2">
            Copy <code>tests/player/env.example</code> to <code>.env.player.local</code>
          </p>
          <pre>{`cp tests/player/env.example .env.player.local
# Set SHOPVERSE_URL to ${shopverseUrl}
npm run test:player`}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minimal Playwright example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">{`await page.goto('${shopverseUrl}/login');
await page.getByLabel('Username').fill('alice');
await page.getByLabel('Password').fill('Password123');
await page.getByRole('button', { name: 'Sign In' }).click();
await page.goto('/catalog');
// explore, assert, screenshot...`}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other tools</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Cypress / Puppeteer / Selenium</strong> — same flow: open ShopVerse URL, log in
            with store accounts, automate the UI.
          </p>
          <p>
            <strong>Browser DevTools</strong> — manual exploratory testing with Network and Console
            tabs.
          </p>
          <p>
            Full docs: <code>docs/PLAYER_TESTING.md</code> in the repository.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

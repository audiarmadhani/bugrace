import { test, expect } from '@playwright/test';
import {
  formatChallengeReport,
  getTodayChallenge,
  type TodayChallenge,
} from '../helpers/challenge';
import { getBugScenario } from '../helpers/bug-scenarios';
import { loginShopVerse } from '../player/helpers/shopverse';

let todayChallenge: TodayChallenge | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Today\'s bug — QA reveal & verify', () => {
  test.beforeAll(async () => {
    todayChallenge = await getTodayChallenge();
  });

  test('reveal today\'s active bug from database', async () => {
    expect(
      todayChallenge,
      'No daily_challenges row for today. Run `npm run seed` or check production DB.'
    ).not.toBeNull();

    const challenge = todayChallenge!;
    const report = formatChallengeReport(challenge);

    console.log('\n' + report + '\n');

    test.info().annotations.push({
      type: 'today-bug',
      description: report,
    });

    expect(challenge.bugId).toBeTruthy();
    expect(challenge.status).toBe('OPEN');
  });

  test('verify bug behavior in ShopVerse', async ({ page, context }) => {
    test.setTimeout(120_000);

    expect(todayChallenge).not.toBeNull();
    const challenge = todayChallenge!;
    const scenario = getBugScenario(challenge.bugId, challenge.definition);

    test.info().annotations.push({
      type: 'scenario',
      description: scenario.manualSteps.join('\n'),
    });

    await test.step('Sign in to ShopVerse', async () => {
      await loginShopVerse(page);
    });

    if (scenario.automated && scenario.verify) {
      const verify = scenario.verify;
      await test.step(`Verify ${challenge.bugId}`, async () => {
        await verify({ page, context });
      });
      console.log(`Automated verification passed for ${challenge.bugId}`);
      return;
    }

    await test.step('Manual verification fallback', async () => {
      await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible();

      console.log(
        [
          `No automated check for ${challenge.bugId}.`,
          'Follow manual steps (attached as annotation):',
          ...scenario.manualSteps.map((s) => `  • ${s}`),
        ].join('\n')
      );

      test.info().annotations.push({
        type: 'manual-only',
        description:
          'This bug has no automated assertion yet. Use the manual steps and compare with the revealed bug metadata.',
      });
    });
  });
});

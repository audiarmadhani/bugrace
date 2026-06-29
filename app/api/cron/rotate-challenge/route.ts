import { format, subDays } from 'date-fns';
import { createAdminClient } from '@/lib/db/admin';
import { getF1Points } from '@/lib/constants';
import { generateSeason } from '@/lib/bug-engine/generator';
import { addDays } from 'date-fns';
import { SEASON_LENGTH_DAYS } from '@/lib/constants';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (process.env.APP_MODE === 'store') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: yesterdayChallenge } = await admin
    .from('daily_challenges')
    .select('*, seasons(id, season_number, end_date)')
    .eq('challenge_date', yesterday)
    .maybeSingle();

  if (yesterdayChallenge && yesterdayChallenge.status === 'OPEN') {
    await admin
      .from('daily_challenges')
      .update({ status: 'REVEALED', revealed_at: new Date().toISOString() })
      .eq('id', yesterdayChallenge.id);

    const { data: submissions } = await admin
      .from('submissions')
      .select('user_id, accuracy_score, submitted_at')
      .eq('daily_challenge_id', yesterdayChallenge.id)
      .order('accuracy_score', { ascending: false })
      .order('submitted_at', { ascending: true })
      .limit(10);

    const seasonId = yesterdayChallenge.season_id;

    for (let i = 0; i < (submissions?.length ?? 0); i++) {
      const sub = submissions![i]!;
      const points = getF1Points(i + 1);

      const { data: existing } = await admin
        .from('season_user_points')
        .select('points')
        .eq('season_id', seasonId)
        .eq('user_id', sub.user_id)
        .maybeSingle();

      await admin.from('season_user_points').upsert(
        {
          season_id: seasonId,
          user_id: sub.user_id,
          points: (existing?.points ?? 0) + points,
        },
        { onConflict: 'season_id,user_id' }
      );

      if (i < 3) {
        await admin.from('user_badges').upsert(
          {
            user_id: sub.user_id,
            badge_key: `TOP_THREE_FINISH_${yesterday}`,
          },
          { onConflict: 'user_id,badge_key' }
        );
      }
    }
  }

  const season = yesterdayChallenge?.seasons as { id: string; end_date: string } | null;
  if (season && yesterday === season.end_date) {
    const nextStart = addDays(new Date(today), 0);
    const { data: lastSeason } = await admin
      .from('seasons')
      .select('season_number')
      .order('season_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSeasonNumber = (lastSeason?.season_number ?? 0) + 1;
    const startDate = new Date(today);
    const endDate = addDays(startDate, SEASON_LENGTH_DAYS - 1);

    const { data: newSeason } = await admin
      .from('seasons')
      .insert({
        season_number: nextSeasonNumber,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        application: 'store',
      })
      .select('id')
      .single();

    if (newSeason) {
      const challenges = generateSeason('store', startDate);
      await admin.from('daily_challenges').insert(
        challenges.map((c) => ({
          season_id: newSeason.id,
          challenge_date: format(c.challengeDate, 'yyyy-MM-dd'),
          bug_id: c.bugId,
          bug_title: c.bugTitle,
          correct_page: c.correctPage,
          correct_category: c.correctCategory,
          correct_severity: c.correctSeverity,
          root_cause: c.rootCause,
          status: 'OPEN',
        }))
      );
    }
  }

  return NextResponse.json({ ok: true, processed: yesterday });
}

import 'dotenv/config';
import { format, addDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';
import { generateSeason } from '../lib/bug-engine/generator';
import { CHALLENGE_ACCOUNTS } from '../data/challenge-accounts';
import { SEASON_LENGTH_DAYS } from '../lib/constants';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  console.log('Seeding BugRace...');

  const startDate = new Date();
  const endDate = addDays(startDate, SEASON_LENGTH_DAYS - 1);

  const { data: existingSeason } = await admin
    .from('seasons')
    .select('id')
    .eq('season_number', 1)
    .maybeSingle();

  if (existingSeason) {
    console.log('Season 1 already exists, skipping season seed.');
  } else {
    const { data: season, error: seasonError } = await admin
      .from('seasons')
      .insert({
        season_number: 1,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        application: 'store',
      })
      .select('id')
      .single();

    if (seasonError || !season) {
      throw new Error(seasonError?.message ?? 'Failed to create season');
    }

    const challenges = generateSeason('store', startDate);
    const { error: challengeError } = await admin.from('daily_challenges').insert(
      challenges.map((c) => ({
        season_id: season.id,
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

    if (challengeError) throw new Error(challengeError.message);
    console.log(`Created Season 1 with ${challenges.length} daily challenges.`);
  }

  for (const account of Object.values(CHALLENGE_ACCOUNTS)) {
    await admin.from('challenge_profiles').upsert(
      {
        username: account.username,
        first_name: account.firstName,
        last_name: account.lastName,
        email: account.email,
      },
      { onConflict: 'username' }
    );
  }
  console.log('Seeded challenge profiles.');

  const { count } = await admin
    .from('challenge_orders')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) === 0) {
    for (const account of Object.values(CHALLENGE_ACCOUNTS)) {
      const { data: order } = await admin
        .from('challenge_orders')
        .insert({
          username: account.username,
          status: 'Delivered',
          total: 49.99,
        })
        .select('id')
        .single();

      if (order) {
        await admin.from('challenge_order_items').insert({
          order_id: order.id,
          product_id: 'p16',
          quantity: 1,
          unit_price: 49.99,
        });
      }
    }
    console.log('Seeded sample orders.');
  }

  console.log('Seed complete.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

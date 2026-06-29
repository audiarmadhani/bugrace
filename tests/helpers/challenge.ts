import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { getBugById } from '@/lib/bug-engine/registry';
import type { BugDefinition } from '@/lib/bug-engine/types';
import { requireEnv } from './env';

export type TodayChallenge = {
  id: string;
  challengeDate: string;
  status: 'OPEN' | 'REVEALED';
  bugId: string;
  bugTitle: string;
  correctPage: string;
  correctCategory: string;
  correctSeverity: string;
  rootCause: string;
  definition: BugDefinition | undefined;
};

function adminClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function getTodayChallenge(): Promise<TodayChallenge | null> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const supabase = adminClient();

  const { data, error } = await supabase
    .from('daily_challenges')
    .select(
      'id, challenge_date, status, bug_id, bug_title, correct_page, correct_category, correct_severity, root_cause'
    )
    .eq('challenge_date', today)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load today's challenge: ${error.message}`);
  }
  if (!data) return null;

  const bugId = data.bug_id as string;

  return {
    id: data.id,
    challengeDate: data.challenge_date,
    status: data.status as 'OPEN' | 'REVEALED',
    bugId,
    bugTitle: data.bug_title,
    correctPage: data.correct_page,
    correctCategory: data.correct_category,
    correctSeverity: data.correct_severity,
    rootCause: data.root_cause,
    definition: getBugById(bugId),
  };
}

export function formatChallengeReport(challenge: TodayChallenge): string {
  const def = challenge.definition;
  const lines = [
    '=== TODAY\'S BUG (QA reveal) ===',
    `Date: ${challenge.challengeDate}`,
    `Status: ${challenge.status}`,
    `Bug ID: ${challenge.bugId}`,
    `Title: ${challenge.bugTitle}`,
    `Page: ${challenge.correctPage}`,
    `Category: ${challenge.correctCategory}`,
    `Severity: ${challenge.correctSeverity}`,
    `Root cause: ${challenge.rootCause}`,
  ];

  if (def) {
    lines.push(
      `Difficulty: ${def.difficulty}/5`,
      `Injection point: ${def.injectionPoint}`,
      `Strategy: ${def.implementationStrategy}`
    );
  }

  lines.push('==============================');
  return lines.join('\n');
}

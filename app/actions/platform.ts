'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { setChallengeStartCookie } from '@/lib/auth/challenge-start-cookie';
import { recordChallengeView } from '@/services/analytics-service';

export async function startChallengeAction(formData: FormData) {
  const challengeId = formData.get('challengeId') as string;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  await recordChallengeView(user.id, challengeId);
  await setChallengeStartCookie({
    challengeId,
    startedAt: new Date().toISOString(),
  });

  redirect('/challenge/store/login');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

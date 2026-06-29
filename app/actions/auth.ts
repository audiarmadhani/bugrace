'use server';

import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { createSubmission, type SubmitBugInput } from '@/services/submission-service';
import type { AuthActionResult } from '@/lib/auth/errors';
import type { SubmissionResult } from '@/types';

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const username = (formData.get('username') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!username || username.length < 3) {
    return { ok: false, error: 'Username must be at least 3 characters.' };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: 'Passwords do not match.' };
  }

  const admin = createAdminClient();
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existingProfile) {
    return { ok: false, error: 'Username is already taken.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data.session) {
    return { ok: true };
  }

  return {
    ok: true,
    needsEmailConfirmation: true,
  };
}

export async function submitBugAction(input: SubmitBugInput): Promise<SubmissionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };
  return createSubmission(user.id, input);
}

export async function updateProfileAction(username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated.' };

  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

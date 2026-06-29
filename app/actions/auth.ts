'use server';

import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { createSubmission, type SubmitBugInput } from '@/services/submission-service';
import {
  assertSupabaseEnv,
  extractAuthError,
  extractDbError,
  type AuthActionResult,
} from '@/lib/auth/errors';
import type { SubmissionResult } from '@/types';

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const configError = assertSupabaseEnv();
  if (configError) return { ok: false, error: configError };

  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: extractAuthError(error) };
  return { ok: true };
}

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const configError = assertSupabaseEnv();
  if (configError) return { ok: false, error: configError };

  const username = (formData.get('username') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!username || username.length < 3) {
    return { ok: false, error: 'Username must be at least 3 characters.' };
  }

  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: 'Passwords do not match.' };
  }

  const admin = createAdminClient();

  const { data: existingProfile, error: profileLookupError } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (profileLookupError) {
    console.error('[register] profile lookup failed:', profileLookupError);
    return { ok: false, error: extractDbError(profileLookupError) };
  }

  if (existingProfile) {
    return { ok: false, error: 'Username is already taken.' };
  }

  const { data: existingEmailProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingEmailProfile) {
    return { ok: false, error: 'An account with this email already exists. Try logging in.' };
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      ...(siteUrl ? { emailRedirectTo: `${siteUrl}/login` } : {}),
    },
  });

  if (error) {
    console.error('[register] signUp failed:', {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    return { ok: false, error: extractAuthError(error) };
  }

  if (!data.user) {
    return {
      ok: false,
      error:
        'Registration failed. If you already registered, check your email or try logging in.',
    };
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: data.user.id,
      email,
      username,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error('[register] profile upsert failed:', profileError);
    return { ok: false, error: extractDbError(profileError) };
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

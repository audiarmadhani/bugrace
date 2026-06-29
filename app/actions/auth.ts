'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { createSubmission, type SubmitBugInput } from '@/services/submission-service';
import type { SubmissionResult } from '@/types';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect('/dashboard');
}

export async function registerAction(formData: FormData) {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) return { error: error.message };
  redirect('/dashboard');
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

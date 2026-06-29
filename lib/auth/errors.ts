import type { AuthError } from '@supabase/supabase-js';

export type AuthActionResult =
  | { ok: true; needsEmailConfirmation?: boolean }
  | { ok: false; error: string };

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  user_already_exists:
    'An account with this email already exists. Try logging in instead.',
  email_exists:
    'An account with this email already exists. Try logging in instead.',
  unexpected_failure:
    'Could not save your account. Ensure Supabase migrations are applied and the username is not already taken.',
  signup_disabled: 'Registration is currently disabled.',
  weak_password: 'Password is too weak. Use at least 8 characters.',
  invalid_credentials: 'Invalid email or password.',
  email_not_confirmed:
    'Please confirm your email before signing in. Check your inbox.',
  over_email_send_rate_limit:
    'Too many emails sent. Please wait a few minutes and try again.',
  over_request_rate_limit:
    'Too many attempts. Please wait a few minutes and try again.',
};

export function extractAuthError(error: AuthError): string {
  const code = error.code ?? '';
  const message = error.message?.trim() ?? '';

  if (message && message !== '{}' && message !== '[object Object]') {
    return message;
  }

  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code]!;
  }

  if (code) {
    return `Authentication error (${code}).`;
  }

  if (error.status === 422) {
    return 'Invalid registration details. Check your email and password.';
  }

  if (error.status === 500) {
    return 'Server error during registration. Verify Supabase migrations are applied.';
  }

  return 'Registration failed. If you already have an account, try logging in.';
}

export function extractDbError(error: {
  message?: string;
  code?: string;
  details?: string;
}): string {
  const message = error.message?.trim() ?? '';

  if (message && message !== '{}') {
    if (error.code === '23505' || message.includes('duplicate key')) {
      if (message.includes('username')) {
        return 'Username is already taken.';
      }
      if (message.includes('email')) {
        return 'An account with this email already exists.';
      }
      return 'This account already exists.';
    }
    return message;
  }

  if (error.code === '23505') {
    return 'Username or email is already in use.';
  }

  return 'Database error. Please try again.';
}

export function formatAuthError(error: unknown): string {
  if (typeof error === 'string' && error.length > 0 && error !== '{}') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0 && message !== '{}') {
      return message;
    }
  }

  return 'Something went wrong. Please try again.';
}

export function assertSupabaseEnv(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return 'Server misconfiguration: NEXT_PUBLIC_SUPABASE_URL is missing.';
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return 'Server misconfiguration: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.';
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is missing on the server.';
  }
  return null;
}

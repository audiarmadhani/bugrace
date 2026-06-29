import type { BugBehaviorMap } from '@/lib/bug-engine/types';

type LoginCtx = {
  username?: string;
  password?: string;
  rememberMe?: boolean;
  failedAttempts?: number;
};

export const loginBugBehaviors: BugBehaviorMap = {
  LOGIN_EMPTY_CREDENTIALS_ACCEPTED: (point, ctx, defaultFn) => {
    if (point !== 'store.login.validate') return defaultFn();
    const c = ctx as LoginCtx;
    if (!c.username && !c.password) return { success: true, username: 'guest' };
    return defaultFn();
  },
  LOGIN_WRONG_ERROR_MESSAGE: (point, _ctx, defaultFn) => {
    if (point !== 'store.login.errorMessage') return defaultFn();
    return 'Network error. Please try again later.';
  },
  LOGIN_CASE_SENSITIVE_USERNAME: (point, ctx, defaultFn) => {
    if (point !== 'store.login.validate') return defaultFn();
    const c = ctx as LoginCtx & { accounts: Record<string, string> };
    const key = Object.keys(c.accounts).find((k) => k === c.username);
    if (key && c.accounts[key] === c.password) return { success: true, username: key };
    return { success: false };
  },
  LOGIN_REMEMBER_ME_IGNORED: (point, _ctx, defaultFn) => {
    if (point !== 'store.login.validate') return defaultFn();
    const result = defaultFn() as { success: boolean; username?: string };
    if (result.success) return { ...result, sessionMaxAge: 0 };
    return result;
  },
  LOGIN_NO_RATE_LIMITING: (point, _ctx, defaultFn) => defaultFn(),
  LOGIN_PASSWORD_VISIBLE_IN_ERROR: (point, ctx, defaultFn) => {
    if (point !== 'store.login.errorMessage') return defaultFn();
    const c = ctx as LoginCtx;
    return `Invalid credentials for password: ${c.password ?? ''}`;
  },
};

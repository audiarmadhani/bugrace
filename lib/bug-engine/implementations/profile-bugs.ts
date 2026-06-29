import type { BugBehaviorMap } from '@/lib/bug-engine/types';

type Profile = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
};

type ProfileCtx = {
  profile?: Profile;
  updates?: Partial<Profile>;
  sessionUsername?: string;
  cachedProfile?: Profile;
};

export const profileBugBehaviors: BugBehaviorMap = {
  PROFILE_SESSION_LEAK_AFTER_LOGOUT: (point, ctx, defaultFn) => {
    if (point === 'store.profile.onLogout') return { invalidated: false };
    if (point === 'store.profile.read') {
      const c = ctx as ProfileCtx;
      if (c.cachedProfile) return c.cachedProfile;
    }
    return defaultFn();
  },
  PROFILE_CHANGES_NOT_PERSISTED: (point, _ctx, defaultFn) => {
    if (point !== 'store.profile.update') return defaultFn();
    return { success: true, persisted: false };
  },
  PROFILE_EDIT_OTHER_USER: (point, ctx, defaultFn) => {
    if (point !== 'store.profile.update') return defaultFn();
    const c = ctx as ProfileCtx;
    return { success: true, username: c.updates?.username ?? c.sessionUsername };
  },
  PROFILE_EMAIL_READONLY_BYPASS: (point, ctx, defaultFn) => {
    if (point !== 'store.profile.read') return defaultFn();
    const p = defaultFn() as Profile;
    return { ...p, emailEditable: true };
  },
  PROFILE_VALIDATION_BYPASS: (point, ctx, defaultFn) => {
    if (point !== 'store.profile.update') return defaultFn();
    const c = ctx as ProfileCtx;
    return { success: true, data: c.updates };
  },
  PROFILE_XSS_IN_NAME: (point, ctx, defaultFn) => {
    if (point !== 'store.profile.update') return defaultFn();
    const c = ctx as ProfileCtx;
    return { success: true, data: c.updates };
  },
  PROFILE_STALE_AFTER_UPDATE: (point, ctx, defaultFn) => {
    if (point !== 'store.profile.read') return defaultFn();
    const c = ctx as ProfileCtx;
    if (c.cachedProfile) return c.cachedProfile;
    return defaultFn();
  },
  PROFILE_PASSWORD_SHOWN: (point, ctx, defaultFn) => {
    if (point !== 'store.profile.read') return defaultFn();
    const p = defaultFn() as Profile;
    return { ...p, password: 'Password123' };
  },
  PROFILE_UPDATE_WRONG_USER: (point, _ctx, defaultFn) => {
    if (point !== 'store.profile.update') return defaultFn();
    const data = defaultFn() as Profile;
    return { ...data, username: 'alice' };
  },
  PROFILE_EMAIL_DUPLICATE: (point, ctx, defaultFn) => {
    if (point !== 'store.profile.update') return defaultFn();
    return { success: true, skipDuplicateCheck: true };
  },
  PROFILE_LAST_NAME_TRUNCATED: (point, ctx, defaultFn) => {
    if (point !== 'store.profile.update') return defaultFn();
    const c = ctx as ProfileCtx;
    const last = c.updates?.lastName ?? '';
    return { success: true, lastName: last.slice(0, 5) };
  },
};

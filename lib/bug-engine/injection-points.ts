import { getBehaviorHandler } from '@/lib/bug-engine/registry';
import type { InjectionPoint } from '@/lib/bug-engine/types';

export function isBugActive(
  activeBug: string | null,
  bugId: string
): boolean {
  return activeBug === bugId;
}

export function applyInjection<T>(
  activeBug: string | null,
  point: InjectionPoint,
  defaultBehavior: () => T,
  ctx?: unknown
): T {
  if (!activeBug) {
    return defaultBehavior();
  }
  const handler = getBehaviorHandler(activeBug, point);
  if (!handler) {
    return defaultBehavior();
  }
  const result = handler(point, ctx, defaultBehavior);
  return result as T;
}

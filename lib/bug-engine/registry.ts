import type { BugBehaviorHandler, InjectionPoint } from '@/lib/bug-engine/types';
import { loginBugBehaviors } from '@/lib/bug-engine/implementations/login-bugs';
import { catalogBugBehaviors } from '@/lib/bug-engine/implementations/catalog-bugs';
import { productBugBehaviors } from '@/lib/bug-engine/implementations/product-bugs';
import { cartBugBehaviors } from '@/lib/bug-engine/implementations/cart-bugs';
import { checkoutBugBehaviors } from '@/lib/bug-engine/implementations/checkout-bugs';
import { ordersBugBehaviors } from '@/lib/bug-engine/implementations/orders-bugs';
import { profileBugBehaviors } from '@/lib/bug-engine/implementations/profile-bugs';
import { STORE_BUGS } from '@/data/bugs';
import type { ApplicationId, BugDefinition, BugBehaviorMap } from '@/lib/bug-engine/types';

export const ALL_BUG_BEHAVIORS: BugBehaviorMap = {
  ...loginBugBehaviors,
  ...catalogBugBehaviors,
  ...productBugBehaviors,
  ...cartBugBehaviors,
  ...checkoutBugBehaviors,
  ...ordersBugBehaviors,
  ...profileBugBehaviors,
};

export function getBugById(id: string): BugDefinition | undefined {
  return STORE_BUGS.find((b) => b.id === id);
}

export function getBugsForApplication(app: ApplicationId): BugDefinition[] {
  return STORE_BUGS.filter((b) => b.application === app);
}

export function getBehaviorHandler(
  bugId: string,
  point: InjectionPoint
): BugBehaviorHandler | undefined {
  const handler = ALL_BUG_BEHAVIORS[bugId];
  if (!handler) return undefined;
  return handler;
}

export function validateRegistry(): void {
  const ids = new Set<string>();
  for (const bug of STORE_BUGS) {
    if (ids.has(bug.id)) {
      throw new Error(`Duplicate bug id: ${bug.id}`);
    }
    ids.add(bug.id);
    if (!ALL_BUG_BEHAVIORS[bug.id]) {
      throw new Error(`Missing behavior handler for bug: ${bug.id}`);
    }
  }
  if (STORE_BUGS.length < 50) {
    throw new Error(`Registry needs at least 50 bugs, found ${STORE_BUGS.length}`);
  }
}

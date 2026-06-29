import type { BugBehaviorMap } from '@/lib/bug-engine/types';

type CheckoutCtx = {
  phone?: string;
  email?: string;
  postalCode?: string;
  fullName?: string;
  city?: string;
  address?: string;
  cartTotal?: number;
  username?: string;
  idempotencyKey?: string;
  seenKeys?: Set<string>;
};

export const checkoutBugBehaviors: BugBehaviorMap = {
  CHECKOUT_DUPLICATE_ORDER: (point, _ctx, defaultFn) => {
    if (point !== 'store.checkout.submit') return defaultFn();
    const order = defaultFn();
    return { orders: [order, order], duplicate: true };
  },
  CHECKOUT_EMPTY_PHONE_ACCEPTED: (point, ctx, defaultFn) => {
    if (point !== 'store.checkout.validate') return defaultFn();
    const c = ctx as CheckoutCtx;
    return { valid: true, data: c };
  },
  CHECKOUT_EMAIL_VALIDATION_MISSING: (point, ctx, defaultFn) => {
    if (point !== 'store.checkout.validate') return defaultFn();
    const c = ctx as CheckoutCtx;
    return { valid: Boolean(c.email), data: c };
  },
  CHECKOUT_POSTAL_CODE_OPTIONAL: (point, ctx, defaultFn) => {
    if (point !== 'store.checkout.validate') return defaultFn();
    return { valid: true, data: ctx };
  },
  CHECKOUT_ORDER_TOTAL_WRONG: (point, ctx, defaultFn) => {
    if (point !== 'store.checkout.submit') return defaultFn();
    const c = ctx as CheckoutCtx;
    const order = defaultFn() as { total: number };
    return { ...order, total: (c.cartTotal ?? order.total) * 0.5 };
  },
  CHECKOUT_CART_NOT_CLEARED: (point, _ctx, defaultFn) => {
    if (point !== 'store.checkout.submit') return defaultFn();
    const order = defaultFn();
    return { ...((order as object) ?? {}), clearCart: false };
  },
  CHECKOUT_ADDRESS_XSS: (point, ctx, defaultFn) => {
    if (point !== 'store.checkout.validate') return defaultFn();
    return { valid: true, data: ctx };
  },
  CHECKOUT_DOUBLE_SUBMIT: (point, ctx, defaultFn) => {
    if (point !== 'store.checkout.submit') return defaultFn();
    const c = ctx as CheckoutCtx;
    return {
      username: c.username ?? 'alice',
      total: c.cartTotal ?? 0,
      duplicate: false,
      clearCart: true,
    };
  },
  CHECKOUT_NAME_NUMBERS: (point, ctx, defaultFn) => {
    if (point !== 'store.checkout.validate') return defaultFn();
    const c = ctx as CheckoutCtx;
    return { valid: Boolean(c.fullName), data: c };
  },
  CHECKOUT_CITY_SPECIAL_CHARS: (point, ctx, defaultFn) => {
    if (point !== 'store.checkout.validate') return defaultFn();
    const c = ctx as CheckoutCtx;
    const city = c.city ?? '';
    if (/[-']/.test(city)) return { valid: false, error: 'Invalid city' };
    return defaultFn();
  },
  CHECKOUT_ORDER_WRONG_USER: (point, _ctx, defaultFn) => {
    if (point !== 'store.checkout.submit') return defaultFn();
    const order = defaultFn() as { username: string };
    return { ...order, username: 'alice' };
  },
};

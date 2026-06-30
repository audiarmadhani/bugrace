import type { BugBehaviorMap } from '@/lib/bug-engine/types';
import type { CartLineRef } from '@/lib/store/cart-limits';

type CartItem = { productId: string; unitPrice: number; quantity: number };
type CartCtx = { items?: CartItem[]; productId?: string; quantity?: number };

export const cartBugBehaviors: BugBehaviorMap = {
  CART_TOTAL_IGNORES_QUANTITY: (point, ctx, defaultFn) => {
    if (point !== 'store.cart.calculateTotal') return defaultFn();
    return (ctx as CartCtx).items?.reduce((sum, i) => sum + i.unitPrice, 0) ?? 0;
  },
  CART_REMOVE_DOES_NOT_UPDATE_TOTAL: (point, ctx, defaultFn) => {
    if (point !== 'store.cart.removeItem') return defaultFn();
    const c = ctx as CartCtx & { previousTotal?: number };
    return { items: defaultFn(), total: c.previousTotal ?? 0 };
  },
  CART_NEGATIVE_QUANTITY_ACCEPTED: (point, ctx, defaultFn) => {
    if (point !== 'store.cart.updateQuantity') return defaultFn();
    return (ctx as CartCtx).quantity;
  },
  CART_PERSISTS_AFTER_LOGOUT: (point, _ctx, defaultFn) => {
    if (point === 'store.cart.onLogout') return { cleared: false };
    return defaultFn();
  },
  CART_DOUBLE_COUNT_SAME_ITEM: (point, ctx, defaultFn) => {
    if (point !== 'store.cart.calculateTotal') return defaultFn();
    const items = (ctx as CartCtx).items ?? [];
    return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) + items.length * 0.01;
  },
  CART_QUANTITY_ZERO_NOT_REMOVED: (point, ctx, defaultFn) => {
    if (point !== 'store.cart.updateQuantity') return defaultFn();
    const q = (ctx as CartCtx).quantity ?? 0;
    if (q === 0) return { keepItem: true, quantity: 0 };
    return defaultFn();
  },
  CART_SUBTOTAL_TAX_DOUBLE: (point, ctx, defaultFn) => {
    if (point !== 'store.cart.calculateTotal') return defaultFn();
    const base = defaultFn() as number;
    return base * 1.08 * 1.08;
  },
  CART_EMPTY_CHECKOUT_ENABLED: (point, ctx, defaultFn) => {
    if (point !== 'store.cart.calculateTotal') return defaultFn();
    const items = (ctx as CartCtx).items ?? [];
    return { total: 0, itemCount: items.length === 0 ? 1 : items.length };
  },
  CART_ITEM_PRICE_STALE: (point, ctx, defaultFn) => {
    if (point !== 'store.cart.calculateTotal') return defaultFn();
    const items = (ctx as CartCtx).items ?? [];
    return items.reduce((sum, i) => sum + (i.unitPrice * 0.5) * i.quantity, 0);
  },
  CART_REMOVE_WRONG_ITEM: (point, ctx, defaultFn) => {
    if (point !== 'store.cart.removeItem') return defaultFn();
    const items = (ctx as CartCtx).items ?? [];
    return items.slice(1);
  },
  CART_MAX_ITEMS_BYPASS: (point, ctx, defaultFn) => {
    const c = ctx as CartCtx & { stock?: number; productId?: string; existingCart?: CartLineRef[] };
    if (point === 'store.product.quantity') {
      const qty = c.quantity ?? 1;
      const stock = c.stock ?? 0;
      if (qty < 1 || qty > stock || qty > 99) return null;
      return qty;
    }
    if (point === 'store.cart.updateQuantity') {
      const qty = c.quantity ?? 0;
      if (qty >= 1 && qty <= 99) return qty;
      return null;
    }
    return defaultFn();
  },
};

import type { BugBehaviorMap } from '@/lib/bug-engine/types';

type ProductCtx = {
  quantity?: number;
  stock?: number;
  price?: number;
  productId?: string;
};

export const productBugBehaviors: BugBehaviorMap = {
  PRODUCT_ZERO_QUANTITY_ADD: (point, ctx, defaultFn) => {
    if (point !== 'store.product.quantity') return defaultFn();
    const q = (ctx as ProductCtx).quantity ?? 1;
    return q >= 0 ? q : defaultFn();
  },
  PRODUCT_NEGATIVE_QUANTITY: (point, ctx, defaultFn) => {
    if (point !== 'store.product.quantity') return defaultFn();
    const q = (ctx as ProductCtx).quantity ?? 1;
    return q > -100 ? q : 1;
  },
  PRODUCT_EXCEEDS_STOCK: (point, _ctx, defaultFn) => defaultFn(),
  PRODUCT_PRICE_DISPLAY_TAX: (point, ctx, defaultFn) => {
    if (point !== 'store.product.addToCart') return defaultFn();
    const c = ctx as ProductCtx;
    return { ...((defaultFn() as object) ?? {}), unitPrice: (c.price ?? 0) * 0.9 };
  },
  PRODUCT_ADD_NO_FEEDBACK: (point, ctx, defaultFn) => {
    if (point !== 'store.product.addToCart') return defaultFn();
    const c = ctx as ProductCtx;
    if ((c.stock ?? 1) <= 0) return { success: true, added: false };
    return defaultFn();
  },
  PRODUCT_QUANTITY_MAX_IGNORED: (point, ctx, defaultFn) => {
    if (point !== 'store.product.quantity') return defaultFn();
    return (ctx as ProductCtx).quantity ?? 1;
  },
};

import type { BugBehaviorMap } from '@/lib/bug-engine/types';

type Order = {
  id: string;
  username: string;
  status: string;
  total: number;
  createdAt: string;
  items?: { unitPrice: number; quantity: number }[];
};

type OrdersCtx = {
  orders?: Order[];
  username?: string;
  cachedOrders?: Order[];
};

export const ordersBugBehaviors: BugBehaviorMap = {
  ORDERS_VIEW_OTHER_USERS_ORDERS: (point, ctx, defaultFn) => {
    if (point !== 'store.orders.list') return defaultFn();
    const c = ctx as OrdersCtx;
    return c.orders ?? [];
  },
  ORDERS_TOTAL_MISMATCH: (point, ctx, defaultFn) => {
    if (point !== 'store.orders.displayTotal') return defaultFn();
    const order = ctx as Order;
    return order.items?.reduce((sum, i) => sum + i.unitPrice, 0) ?? order.total;
  },
  ORDERS_STATUS_ALWAYS_PROCESSING: (point, ctx, defaultFn) => {
    if (point !== 'store.orders.list') return defaultFn();
    const orders = defaultFn() as Order[];
    return orders.map((o) => ({ ...o, status: 'Processing' }));
  },
  ORDERS_SORT_DATE_WRONG: (point, ctx, defaultFn) => {
    if (point !== 'store.orders.list') return defaultFn();
    const orders = [...((ctx as OrdersCtx).orders ?? [])];
    return orders.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },
  ORDERS_EMPTY_STATE_HIDDEN: (point, ctx, defaultFn) => {
    if (point !== 'store.orders.list') return defaultFn();
    const c = ctx as OrdersCtx;
    if (c.cachedOrders?.length) return c.cachedOrders;
    return defaultFn();
  },
  ORDERS_ID_TRUNCATED: (point, ctx, defaultFn) => {
    if (point !== 'store.orders.list') return defaultFn();
    const orders = defaultFn() as Order[];
    return orders.map((o) => ({ ...o, id: o.id.slice(0, 8) }));
  },
};

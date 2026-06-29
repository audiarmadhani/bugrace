import type { BugBehaviorMap } from '@/lib/bug-engine/types';
import type { Product } from '@/data/products';

type CatalogCtx = {
  products?: Product[];
  query?: string;
  category?: string;
  sort?: string;
  priceMin?: number;
  priceMax?: number;
};

export const catalogBugBehaviors: BugBehaviorMap = {
  CATALOG_SEARCH_CASE_SENSITIVE: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.search') return defaultFn();
    const c = ctx as CatalogCtx;
    const q = c.query ?? '';
    return (c.products ?? []).filter((p) =>
      p.name.includes(q) || p.description.includes(q)
    );
  },
  CATALOG_SORT_PRICE_INCORRECT: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.sort') return defaultFn();
    const c = ctx as CatalogCtx;
    const items = [...(c.products ?? [])];
    if (c.sort === 'price-asc') {
      return items.sort((a, b) => b.price - a.price);
    }
    if (c.sort === 'price-desc') {
      return items.sort((a, b) => a.price - b.price);
    }
    return defaultFn();
  },
  CATALOG_FILTER_CATEGORY_OR_LOGIC: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.filter') return defaultFn();
    const c = ctx as CatalogCtx;
    if (!c.category || c.category === 'all') return c.products ?? [];
    return (c.products ?? []).filter(
      (p) => p.category === c.category || p.category === 'Electronics'
    );
  },
  CATALOG_STALE_STOCK_DISPLAY: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.filter') return defaultFn();
    return (ctx as CatalogCtx).products?.map((p) => ({ ...p, stock: Math.max(p.stock, 1) }));
  },
  CATALOG_RATING_SORT_BROKEN: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.sort') return defaultFn();
    const c = ctx as CatalogCtx;
    if (c.sort === 'rating') {
      return [...(c.products ?? [])].sort(
        (a, b) => Math.floor(b.rating) - Math.floor(a.rating)
      );
    }
    return defaultFn();
  },
  CATALOG_SEARCH_PARTIAL_WORD: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.search') return defaultFn();
    const c = ctx as CatalogCtx;
    const words = (c.query ?? '').split(' ').filter(Boolean);
    return (c.products ?? []).filter((p) =>
      words.every((w) => p.name.split(' ').includes(w))
    );
  },
  CATALOG_DUPLICATE_PRODUCTS: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.filter') return defaultFn();
    const items = defaultFn() as Product[];
    return [...items, ...items.slice(0, 2)];
  },
  CATALOG_CATEGORY_LABEL_MISMATCH: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.filter') return defaultFn();
    const c = ctx as CatalogCtx;
    if (c.category === 'Clothing') {
      return (c.products ?? []).filter((p) => p.category === 'Electronics');
    }
    return defaultFn();
  },
  CATALOG_PRICE_FILTER_BYPASS: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.filter') return defaultFn();
    const c = ctx as CatalogCtx & { priceMin?: number; priceMax?: number };
    if (c.priceMin !== undefined || c.priceMax !== undefined) {
      return c.products ?? [];
    }
    return defaultFn();
  },
  CATALOG_SEARCH_SPECIAL_CHARS: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.search') return defaultFn();
    const c = ctx as CatalogCtx;
    try {
      const re = new RegExp(c.query ?? '', 'i');
      return (c.products ?? []).filter((p) => re.test(p.name));
    } catch {
      return [];
    }
  },
  CATALOG_SORT_STABLE_BROKEN: (point, ctx, defaultFn) => {
    if (point !== 'store.catalog.sort') return defaultFn();
    const c = ctx as CatalogCtx;
    if (c.sort === 'price-asc') {
      return [...(c.products ?? [])].sort((a, b) => {
        if (a.price === b.price) return Math.random() - 0.5;
        return a.price - b.price;
      });
    }
    return defaultFn();
  },
};

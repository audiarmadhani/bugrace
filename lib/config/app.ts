export type AppMode = 'platform' | 'store';

export function getAppMode(): AppMode | null {
  const mode = process.env.APP_MODE;
  if (mode === 'platform' || mode === 'store') return mode;
  return null;
}

export function isPlatformMode(): boolean {
  const mode = getAppMode();
  return mode === null || mode === 'platform';
}

export function isStoreMode(): boolean {
  const mode = getAppMode();
  return mode === null || mode === 'store';
}

export function getShopverseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SHOPVERSE_URL?.replace(/\/$/, '') ??
    'http://127.0.0.1:3000'
  );
}

export function getPlatformUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PLATFORM_URL?.replace(/\/$/, '') ??
    'http://127.0.0.1:3000'
  );
}

const STORE_PUBLIC_TO_INTERNAL: Record<string, string> = {
  '/login': '/challenge/store/login',
  '/catalog': '/challenge/store/catalog',
  '/cart': '/challenge/store/cart',
  '/checkout': '/challenge/store/checkout',
  '/orders': '/challenge/store/orders',
  '/profile': '/challenge/store/profile',
};

const STORE_INTERNAL_TO_PUBLIC: Record<string, string> = Object.fromEntries(
  Object.entries(STORE_PUBLIC_TO_INTERNAL).map(([publicPath, internalPath]) => [
    internalPath,
    publicPath,
  ])
);

/** Map a ShopVerse public URL to its internal app route (store deploy only). */
export function getStoreInternalPath(publicPath: string): string | null {
  if (STORE_PUBLIC_TO_INTERNAL[publicPath]) {
    return STORE_PUBLIC_TO_INTERNAL[publicPath];
  }
  const productMatch = publicPath.match(/^\/product\/(.+)$/);
  if (productMatch) {
    return `/challenge/store/product/${productMatch[1]}`;
  }
  return null;
}

export function toShopversePublicPath(internalPath: string): string {
  if (STORE_INTERNAL_TO_PUBLIC[internalPath]) {
    return `${getShopverseUrl()}${STORE_INTERNAL_TO_PUBLIC[internalPath]}`;
  }
  const productMatch = internalPath.match(/^\/challenge\/store\/product\/(.+)$/);
  if (productMatch) {
    return `${getShopverseUrl()}/product/${productMatch[1]}`;
  }
  return `${getShopverseUrl()}${internalPath}`;
}

export function getStoreCatalogPath(): string {
  return getAppMode() === 'store' ? '/catalog' : '/challenge/store/catalog';
}

export function getStoreLoginPath(): string {
  return getAppMode() === 'store' ? '/login' : '/challenge/store/login';
}

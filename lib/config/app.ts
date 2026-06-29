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

const STORE_PATH_MAP: Record<string, string> = {
  '/challenge/store/login': '/login',
  '/challenge/store/catalog': '/catalog',
  '/challenge/store/cart': '/cart',
  '/challenge/store/checkout': '/checkout',
  '/challenge/store/orders': '/orders',
  '/challenge/store/profile': '/profile',
};

export function toShopversePublicPath(internalPath: string): string {
  if (STORE_PATH_MAP[internalPath]) {
    return `${getShopverseUrl()}${STORE_PATH_MAP[internalPath]}`;
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

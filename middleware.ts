import { updateSession } from '@/lib/db/middleware';
import { getAppMode, getPlatformUrl, toShopversePublicPath } from '@/lib/config/app';
import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/challenge',
  '/submit-bug',
  '/leaderboard',
  '/profile',
  '/history',
];

const authRoutes = ['/login', '/register'];

const platformOnlyPrefixes = [
  '/dashboard',
  '/submit-bug',
  '/leaderboard',
  '/profile',
  '/history',
  '/api/cron',
];

const storeInternalPrefix = '/challenge/store';

const storeLoginPaths = new Set(['/login', '/challenge/store/login']);

const storePublicPaths = new Set([
  '/login',
  '/catalog',
  '/cart',
  '/checkout',
  '/orders',
  '/profile',
]);

function isStorePublicPath(pathname: string): boolean {
  if (storePublicPaths.has(pathname)) return true;
  if (pathname.startsWith('/product/')) return true;
  if (pathname.startsWith(`${storeInternalPrefix}/`) && pathname !== '/challenge/store/login') {
    return true;
  }
  return false;
}

function isPlatformOnlyOnStore(pathname: string): boolean {
  if (pathname === '/register') return true;
  if (platformOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;
  if (pathname === '/challenge' || pathname.startsWith('/challenge/')) {
    return !pathname.startsWith(storeInternalPrefix);
  }
  return false;
}

function isStoreProtectedPath(pathname: string): boolean {
  if (storeLoginPaths.has(pathname)) return false;
  return isStorePublicPath(pathname) && pathname !== '/login' && pathname !== '/challenge/store/login';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appMode = getAppMode();

  if (appMode === 'platform') {
    if (pathname.startsWith(storeInternalPrefix)) {
      return NextResponse.redirect(toShopversePublicPath(pathname));
    }
  }

  if (appMode === 'store') {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isPlatformOnlyOnStore(pathname)) {
      const target = pathname.startsWith('/api')
        ? getPlatformUrl()
        : `${getPlatformUrl()}${pathname}`;
      return NextResponse.redirect(target);
    }
  }

  const supabaseResponse = await updateSession(request);

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  const isStoreRoute = isStoreProtectedPath(pathname);

  if (isStoreRoute) {
    const session = request.cookies.get('bugrace_challenge_session');
    if (!session) {
      const loginPath = appMode === 'store' ? '/login' : '/challenge/store/login';
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  }

  if ((isProtected || isAuthRoute) && appMode !== 'store') {
    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isProtected && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

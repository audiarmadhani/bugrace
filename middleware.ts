import { updateSession } from '@/lib/db/middleware';
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const supabaseResponse = await updateSession(request);

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  const isStoreRoute = pathname.startsWith('/challenge/store');
  const isStoreLogin = pathname === '/challenge/store/login';

  if (isStoreRoute && !isStoreLogin) {
    const session = request.cookies.get('bugrace_challenge_session');
    if (!session) {
      return NextResponse.redirect(new URL('/challenge/store/login', request.url));
    }
  }

  if (isProtected || isAuthRoute) {
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

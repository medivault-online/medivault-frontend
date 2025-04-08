import { clerkMiddleware, getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { DEFAULT_ROUTES } from '@/config/routes';

const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/sync-user',
  '/unauthorized',
  '/privacy-policy',
  '/terms-of-service',
  '/sso-callback',
  '/profile/mfa(.*)',
  '/api/auth/(.*)',
  '/api/webhooks/(.*)',
];

const isPublicPath = (pathname: string) =>
  publicPaths.some((path) =>
    path.endsWith('(.*)')
      ? pathname.startsWith(path.replace('(.*)', ''))
      : pathname === path
  );

export default clerkMiddleware({
  publicRoutes: publicPaths,
  async afterAuth(auth, req) {
    const { sessionId, sessionClaims } = auth;
    const { pathname, searchParams } = req.nextUrl;

    if (!sessionId && !isPublicPath(pathname)) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('redirect_url', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isPublicPath(pathname) || pathname.startsWith('/admin')) {
      return NextResponse.next();
    }

    try {
      const userRole = sessionClaims?.metadata?.role as Role | undefined;
      const cycleCount = parseInt(searchParams.get('cycle') || '0');

      if (!userRole) {
        return NextResponse.redirect(new URL('/auth/sync-user', req.url));
      }

      if (cycleCount > 2) {
        return NextResponse.redirect(new URL('/auth/sync-user', req.url));
      }

      if (pathname.startsWith('/provider') && userRole !== 'PROVIDER') {
        const url = new URL(DEFAULT_ROUTES[userRole], req.url);
        url.searchParams.set('cycle', (cycleCount + 1).toString());
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith('/patient') && userRole !== 'PATIENT') {
        const url = new URL(DEFAULT_ROUTES[userRole], req.url);
        url.searchParams.set('cycle', (cycleCount + 1).toString());
        return NextResponse.redirect(url);
      }
    } catch (err) {
      console.error('Role check error:', err);
      return NextResponse.redirect(new URL('/auth/sync-user', req.url));
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/(api|trpc)(.*)',
  ],
};

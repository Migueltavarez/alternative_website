import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ─── Login rate limiter (in-memory, single container) ─────────────────────
const loginStore = new Map<string, { count: number; resetAt: number }>();

function loginRateLimited(ip: string): boolean {
  const limit = 10;
  const windowMs = 15 * 60 * 1000;
  const now = Date.now();
  const entry = loginStore.get(ip);
  if (!entry || now > entry.resetAt) {
    loginStore.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ─── Middleware ────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate-limit the credentials login callback
  if (pathname === '/api/auth/callback/credentials') {
    if (loginRateLimited(clientIp(req))) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      );
    }
    return NextResponse.next();
  }

  // Verify JWT for all other protected routes
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  const t = token as any;

  if (t.emailVerified === false) {
    return NextResponse.redirect(new URL('/verify-email', req.url));
  }

  if (
    t.role !== 'ADMIN' &&
    t.profileComplete === false &&
    !pathname.startsWith('/complete-profile')
  ) {
    return NextResponse.redirect(new URL('/complete-profile', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/callback/credentials',
    '/dashboard/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/complete-profile/:path*',
    '/worker/:path*',
  ],
};

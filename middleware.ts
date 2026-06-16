import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (token && token.emailVerified === false) {
      return NextResponse.redirect(new URL('/verify-email', req.url));
    }
    if (
      token &&
      token.role !== 'ADMIN' &&
      token.profileComplete === false &&
      !req.nextUrl.pathname.startsWith('/complete-profile')
    ) {
      return NextResponse.redirect(new URL('/complete-profile', req.url));
    }
    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/complete-profile/:path*',
  ],
};

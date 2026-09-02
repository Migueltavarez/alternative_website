import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { decode } from 'next-auth/jwt';
import { authOptions } from './auth';

export interface ApiSession {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isStudent: boolean;
  profileComplete: boolean;
}

/**
 * Returns an authenticated session for both web (cookie) and mobile (Bearer) requests.
 * Mobile clients send `Authorization: Bearer <nextauth-jwt>`.
 */
export async function getApiSession(req: NextRequest): Promise<ApiSession | null> {
  // 1. Try cookie-based session (web clients)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const u = session.user as any;
    return {
      id: u.id,
      email: u.email ?? '',
      name: u.name ?? null,
      role: u.role ?? 'USER',
      isStudent: u.isStudent ?? false,
      profileComplete: u.profileComplete ?? false,
    };
  }

  // 2. Try Bearer token (mobile clients)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7);
    try {
      const decoded = await decode({
        token: rawToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (decoded?.sub || (decoded as any)?.id) {
        const d = decoded as any;
        return {
          id: d.id ?? d.sub,
          email: d.email ?? '',
          name: d.name ?? null,
          role: d.role ?? 'USER',
          isStudent: d.isStudent ?? false,
          profileComplete: d.profileComplete ?? false,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

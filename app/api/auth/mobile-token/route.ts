import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_ATTEMPTS = 10;
const limitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = limitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    limitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  if (entry.count >= MAX_ATTEMPTS) return true;
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
      include: { addresses: { select: { id: true } } },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in.' },
        { status: 403 }
      );
    }

    const profileComplete = !!(
      user.phone && user.cedula && user.birthDate && user.addresses.length > 0
    );

    const maxAge = 30 * 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);

    const token = await encode({
      token: {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.image,
        role: user.role,
        isStudent: user.isStudent,
        emailVerified: user.emailVerified ? new Date().toISOString() : null,
        profileComplete,
        iat: now,
        exp: now + maxAge,
        jti: crypto.randomUUID(),
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge,
    });

    return NextResponse.json({
      token,
      expiresAt: new Date((now + maxAge) * 1000).toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        isStudent: user.isStudent,
        profileComplete,
      },
    });
  } catch (error) {
    console.error('Mobile token error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

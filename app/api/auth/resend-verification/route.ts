import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://alt3dstudio.com';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`resend:${ip}`, 3, 10 * 60 * 1000); // 3 per 10 min per IP
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }); // silent — don't leak rate-limit status
  }

  const body = await request.json();
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null;

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true, unverified: false });
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiry },
  });

  const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
  sendVerificationEmail(user.email, verifyUrl, user.name).catch((err) =>
    console.error('Resend verification error:', err)
  );

  return NextResponse.json({ ok: true, unverified: false });
}

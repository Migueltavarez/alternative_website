import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://alt3dstudio.com';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, checkOnly } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, name: true, emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true, unverified: false });
  }

  if (checkOnly) {
    return NextResponse.json({ ok: true, unverified: true });
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiry },
  });

  const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
  sendVerificationEmail(user.email, verifyUrl, user.name).catch(err =>
    console.error('Resend verification error:', err)
  );

  return NextResponse.json({ ok: true, unverified: false });
}

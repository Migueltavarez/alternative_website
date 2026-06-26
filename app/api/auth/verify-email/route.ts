import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://alt3dstudio.com';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/verify-email?error=missing_token`);
  }

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/verify-email?error=invalid_token`);
  }

  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    return NextResponse.redirect(`${APP_URL}/verify-email?error=expired_token`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  sendWelcomeEmail(user.email, user.name).catch(err =>
    console.error('Welcome email error:', err)
  );

  return NextResponse.redirect(`${APP_URL}/verify-email?success=true`);
}

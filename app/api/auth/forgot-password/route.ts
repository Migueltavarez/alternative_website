import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000); // 5 per 15 min per IP
    if (!rl.allowed) {
      // Return 200 to avoid leaking rate-limit info to attackers
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success — never reveal whether an email is registered
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      await sendPasswordResetEmail(user.email, resetUrl);
    } else {
      console.log(`[DEV] Reset URL for ${user.email}: ${resetUrl}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

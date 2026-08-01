import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createHmac } from 'crypto';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ hash: null });
  }

  const hmacToken = process.env.CHATWOOT_HMAC_TOKEN;
  if (!hmacToken) {
    return NextResponse.json({ hash: null });
  }

  const userId = (session.user as any).id as string;
  const hash = createHmac('sha256', hmacToken).update(userId).digest('hex');

  return NextResponse.json({ hash });
}

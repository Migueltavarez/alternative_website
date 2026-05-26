import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getReferralStats, getReferralsByUserId } from '@/services/referral.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const statsOnly = searchParams.get('stats') === 'true';

    if (userId && (session.user as any).role === 'ADMIN') {
      const referrals = await getReferralsByUserId(userId);
      return NextResponse.json(referrals);
    }

    if (statsOnly) {
      const stats = await getReferralStats();
      return NextResponse.json(stats);
    }

    const referrals = await getReferralsByUserId((session.user as any).id);
    return NextResponse.json(referrals);
  } catch (error) {
    console.error('Get referrals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

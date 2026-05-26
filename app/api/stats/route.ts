import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDashboardStats } from '@/services/user.service';
import { getRevenueStats } from '@/services/subscription.service';
import { getReferralStats } from '@/services/referral.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [userStats, revenueStats, referralStats] = await Promise.all([
      getDashboardStats(),
      getRevenueStats(),
      getReferralStats(),
    ]);

    return NextResponse.json({
      ...userStats,
      ...revenueStats,
      ...referralStats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

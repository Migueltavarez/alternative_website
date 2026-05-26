import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById } from '@/services/user.service';
import { getSubscriptionByUserId } from '@/services/subscription.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    const [user, subscription] = await Promise.all([
      getUserById(userId),
      getSubscriptionByUserId(userId),
    ]);

    return NextResponse.json({ user, subscription });
  } catch (error) {
    console.error('Get user data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

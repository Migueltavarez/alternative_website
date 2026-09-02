import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { getUserById } from '@/services/user.service';
import { getSubscriptionByUserId } from '@/services/subscription.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user, subscription] = await Promise.all([
      getUserById(session.id),
      getSubscriptionByUserId(session.id),
    ]);

    return NextResponse.json({ user, subscription });
  } catch (error) {
    console.error('Get user data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

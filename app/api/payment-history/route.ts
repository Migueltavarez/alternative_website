import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const [printPayments, creditPurchases, subscription] = await Promise.all([
      prisma.printJob.findMany({
        where: { userId, priceStatus: 'confirmed' },
        select: {
          id: true,
          fileName: true,
          serviceType: true,
          price: true,
          paymentMethod: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: { paidAt: 'desc' },
      }),
      prisma.creditPurchase.findMany({
        where: { userId, status: 'completed' },
        select: {
          id: true,
          credits: true,
          amount: true,
          paymentMethod: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.findUnique({
        where: { userId },
        select: {
          plan: true,
          status: true,
          paymentMethod: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      }),
    ]);

    return NextResponse.json({ printPayments, creditPurchases, subscription });
  } catch (error) {
    console.error('Payment history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

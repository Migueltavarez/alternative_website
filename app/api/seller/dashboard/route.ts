import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user || user.role !== 'SELLER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sellerId = user.id;

    const [seller, clients, commissions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sellerId },
        select: { id: true, name: true, email: true, referralCode: true },
      }),
      prisma.user.findMany({
        where: { referredBySellerId: sellerId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          printJobs: {
            where: { priceStatus: 'confirmed' },
            select: { id: true, price: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sellerCommission.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const firstServiceCount = commissions.filter(c => c.type === 'first_service').length;
    const bonusProgress = firstServiceCount % 5;
    const nextBonusAt = 5 - bonusProgress;

    return NextResponse.json({
      seller,
      clients: clients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
        paidJobsCount: c.printJobs.length,
        totalSpent: c.printJobs.reduce((s, j) => s + (j.price ?? 0), 0),
      })),
      commissions,
      summary: {
        clientsCount: clients.length,
        totalPending: commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0),
        totalPaid: commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0),
        bonusProgress,
        nextBonusAt,
        bonusesEarned: commissions.filter(c => c.type === 'bonus').length,
      },
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

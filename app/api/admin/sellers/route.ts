import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        createdAt: true,
        sellerClients: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        sellerCommissions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            jobPrice: true,
            rate: true,
            clientId: true,
            printJobId: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = sellers.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      referralCode: s.referralCode,
      createdAt: s.createdAt,
      clientsCount: s.sellerClients.length,
      clients: s.sellerClients,
      commissions: s.sellerCommissions,
      totalPending: s.sellerCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
      totalPaid: s.sellerCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get sellers error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

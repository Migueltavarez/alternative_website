import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        cedula: true,
        birthDate: true,
        credits: true,
        discountBalance: true,
        referralCode: true,
        referredBy: true,
        isStudent: true,
        emailVerified: true,
        workerApproved: true,
        createdAt: true,
        lastSeenAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            paymentMethod: true,
          },
        },
        addresses: {
          select: {
            id: true,
            label: true,
            recipientName: true,
            phone: true,
            street: true,
            sector: true,
            city: true,
            province: true,
            isDefault: true,
          },
          orderBy: { isDefault: 'desc' },
        },
        _count: {
          select: {
            printJobs: true,
            referralsGiven: true,
            chatMessages: true,
          },
        },
        printJobs: {
          select: { status: true, priceStatus: true, price: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const jobsByStatus = user.printJobs.reduce<Record<string, number>>((acc, j) => {
      acc[j.status] = (acc[j.status] ?? 0) + 1;
      return acc;
    }, {});

    const totalSpent = user.printJobs
      .filter((j) => j.priceStatus === 'confirmed' && j.price)
      .reduce((sum, j) => sum + (j.price ?? 0), 0);

    return NextResponse.json({
      ...user,
      printJobs: undefined,
      jobsByStatus,
      totalSpent,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

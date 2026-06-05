import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    if (sub.status === 'active') {
      return NextResponse.json({ error: 'Esta suscripción ya está activa' }, { status: 400 });
    }

    const plan = PLANS[sub.plan as keyof typeof PLANS];
    const credits = plan?.credits || 0;

    if (credits > 0) {
      await prisma.user.update({
        where: { id: sub.userId },
        data: { credits: { increment: credits } },
      });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Confirm subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

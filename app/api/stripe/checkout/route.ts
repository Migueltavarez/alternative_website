import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { planId } = body;

    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const sub = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: planId,
        status: 'pending_payment',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentProofUrl: null,
        paymentMethod: null,
      },
      update: {
        plan: planId,
        status: 'pending_payment',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentProofUrl: null,
        paymentMethod: null,
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      subscriptionId: sub.id,
      planId,
      planName: plan.name,
      priceDOP: plan.priceDOP,
      credits: plan.credits,
    });
  } catch (error: any) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

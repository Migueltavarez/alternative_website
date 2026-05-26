import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    if (action === 'pause') {
      if (subscription.status !== 'active') {
        return NextResponse.json(
          { error: 'Solo se pueden pausar suscripciones activas' },
          { status: 400 }
        );
      }

      const updated = await prisma.subscription.update({
        where: { userId },
        data: { status: 'past_due' },
      });

      return NextResponse.json(updated);
    }

    if (action === 'restore') {
      if (subscription.status !== 'past_due' && subscription.status !== 'canceled') {
        return NextResponse.json(
          { error: 'Solo se pueden restaurar suscripciones pausadas o canceladas' },
          { status: 400 }
        );
      }

      const updated = await prisma.subscription.update({
        where: { userId },
        data: { 
          status: 'active',
          cancelAtPeriodEnd: false,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: 'Acción inválida. Usa "pause" o "restore"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Pause/restore subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

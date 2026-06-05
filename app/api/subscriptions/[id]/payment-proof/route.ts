import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { paymentProofUrl, paymentMethod } = await request.json();

    if (!paymentProofUrl || !paymentMethod) {
      return NextResponse.json(
        { error: 'Comprobante y banco son requeridos' },
        { status: 400 }
      );
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    if (sub.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (sub.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Esta suscripción ya tiene un comprobante o está activa' },
        { status: 400 }
      );
    }

    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data: { paymentProofUrl, paymentMethod, status: 'proof_uploaded' },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Subscription payment proof error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

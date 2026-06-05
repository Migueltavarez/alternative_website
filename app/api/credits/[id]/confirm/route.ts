import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    const purchase = await prisma.creditPurchase.findUnique({
      where: { id: params.id },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 });
    }

    if (purchase.status === 'completed') {
      return NextResponse.json({ error: 'Esta compra ya fue confirmada' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: purchase.userId },
      data: { credits: { increment: purchase.credits } },
    });

    const updated = await prisma.creditPurchase.update({
      where: { id: params.id },
      data: { status: 'completed' },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Confirm credit purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

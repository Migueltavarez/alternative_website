import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CREDIT_PRICE_DOP } from '@/lib/credits';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;

    const job = await prisma.printJob.findUnique({ where: { id: params.id } });
    if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    if (job.userId !== userId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    if (job.priceStatus !== 'validated') {
      return NextResponse.json({ error: 'El trabajo no está listo para pagar' }, { status: 400 });
    }
    if (!job.price) {
      return NextResponse.json({ error: 'El trabajo no tiene precio asignado' }, { status: 400 });
    }

    const creditsRequired = Math.ceil(job.price / CREDIT_PRICE_DOP);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    if (user.credits < creditsRequired) {
      return NextResponse.json({
        error: `Créditos insuficientes. Necesitas ${creditsRequired} créditos pero tienes ${user.credits}.`,
      }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: creditsRequired } },
      }),
      prisma.printJob.update({
        where: { id: params.id },
        data: {
          priceStatus: 'confirmed',
          paymentMethod: 'Créditos',
          paidAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true, creditsUsed: creditsRequired });
  } catch (error) {
    console.error('Pay with credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

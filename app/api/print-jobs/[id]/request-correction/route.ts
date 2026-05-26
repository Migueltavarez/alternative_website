import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CORRECTION_COST_CREDITS } from '@/lib/print-constants';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;

    const [job, user] = await Promise.all([
      prisma.printJob.findUnique({ where: { id } }),
      prisma.user.findUnique({ where: { id: userId }, select: { credits: true } }),
    ]);

    if (!job) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }
    if (job.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    if (job.status !== 'needs_revision') {
      return NextResponse.json({ error: 'El trabajo no está en estado de revisión' }, { status: 400 });
    }
    if (!user || user.credits < CORRECTION_COST_CREDITS) {
      return NextResponse.json(
        { error: `Créditos insuficientes. Necesitas ${CORRECTION_COST_CREDITS} créditos.` },
        { status: 400 }
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.printJob.update({
        where: { id },
        data: { status: 'correction_requested' },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: CORRECTION_COST_CREDITS } },
      }),
    ]);

    return NextResponse.json({ success: true, job: updated });
  } catch (error) {
    console.error('Request correction error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

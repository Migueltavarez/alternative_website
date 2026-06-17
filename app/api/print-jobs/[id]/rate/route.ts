import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const userId = (session.user as any).id;
    const { rating, ratingComment } = await request.json();

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return NextResponse.json({ error: 'Calificación inválida (1-5)' }, { status: 400 });
    }

    const job = await prisma.printJob.findUnique({ where: { id: params.id } });
    if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    if (job.userId !== userId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    if (job.status !== 'completed') return NextResponse.json({ error: 'Solo puedes calificar trabajos completados' }, { status: 400 });
    if (job.ratedAt) return NextResponse.json({ error: 'Ya calificaste este trabajo' }, { status: 400 });

    const updated = await prisma.printJob.update({
      where: { id: params.id },
      data: { rating: Number(rating), ratingComment: ratingComment || null, ratedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Rate job error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

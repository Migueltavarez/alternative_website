import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const job = await prisma.printJob.findUnique({
    where: { id: params.id },
    select: { id: true, assignedWorkerId: true, makerPaid: true, status: true },
  });

  if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
  if (job.status !== 'completed') return NextResponse.json({ error: 'El trabajo aún no está completado' }, { status: 400 });
  if (job.makerPaid) return NextResponse.json({ error: 'Ya fue marcado como pagado' }, { status: 400 });

  await prisma.printJob.update({
    where: { id: params.id },
    data: { makerPaid: true, makerPaidAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

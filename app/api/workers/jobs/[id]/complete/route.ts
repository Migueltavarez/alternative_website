import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const jobId = params.id;

    const job = await prisma.printJob.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    if (job.assignedWorkerId !== userId) return NextResponse.json({ error: 'Este trabajo no está asignado a ti' }, { status: 403 });
    if (job.status !== 'printing') return NextResponse.json({ error: 'El trabajo debe estar en estado "Imprimiendo"' }, { status: 400 });

    const profile = await prisma.workerProfile.findUnique({ where: { userId } });

    const updates: any[] = [
      prisma.printJob.update({ where: { id: jobId }, data: { status: 'completed' } }),
      ...(profile ? [prisma.workerProfile.update({ where: { id: profile.id }, data: { completedJobs: { increment: 1 } } })] : []),
      ...(job.assignedMachineId ? [prisma.printerMachine.update({ where: { id: job.assignedMachineId }, data: { completedJobs: { increment: 1 } } })] : []),
    ];

    const [updated] = await prisma.$transaction(updates);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Complete job error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendJobStatusUpdateEmail } from '@/lib/email';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const jobId = params.id;

    let completionPhotoUrl: string | undefined;
    try { const body = await request.json(); completionPhotoUrl = body.completionPhotoUrl || undefined; } catch { /* optional */ }

    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    if (job.assignedWorkerId !== userId) return NextResponse.json({ error: 'Este trabajo no está asignado a ti' }, { status: 403 });
    if (job.status !== 'printing') return NextResponse.json({ error: 'El trabajo debe estar en estado "Imprimiendo"' }, { status: 400 });

    const profile = await prisma.workerProfile.findUnique({ where: { userId } });

    const updates: any[] = [
      prisma.printJob.update({
        where: { id: jobId },
        data: { status: 'completed', completedAt: new Date(), ...(completionPhotoUrl ? { completionPhotoUrl } : {}) },
      }),
      ...(profile ? [prisma.workerProfile.update({ where: { id: profile.id }, data: { completedJobs: { increment: 1 } } })] : []),
      ...(job.assignedMachineId ? [prisma.printerMachine.update({ where: { id: job.assignedMachineId }, data: { completedJobs: { increment: 1 } } })] : []),
    ];

    const [updated] = await prisma.$transaction(updates);

    if (job.user && process.env.RESEND_API_KEY) {
      sendJobStatusUpdateEmail(
        job.user.email,
        job.user.name,
        job.fileName,
        '¡Tu trabajo ha sido completado!',
        '¡Excelentes noticias! Tu trabajo ha sido completado exitosamente. Accede a tu panel para ver los detalles y coordinar la entrega.',
      ).catch((e) => console.error('Complete email error:', e));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Complete job error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

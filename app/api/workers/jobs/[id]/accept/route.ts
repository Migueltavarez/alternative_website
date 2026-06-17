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

    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    if (job.assignedWorkerId !== userId) {
      return NextResponse.json({ error: 'Este trabajo no está asignado a ti' }, { status: 403 });
    }

    if (job.status !== 'assigned' && job.status !== 'correction_requested') {
      return NextResponse.json(
        { error: `No se puede aceptar un trabajo en estado "${job.status}"` },
        { status: 400 }
      );
    }

    if (job.status === 'assigned') {
      const TEN_MIN = 10 * 60 * 1000;
      if (job.assignedAt && Date.now() - job.assignedAt.getTime() > TEN_MIN) {
        return NextResponse.json(
          { error: 'El tiempo para aceptar este trabajo ha expirado' },
          { status: 410 }
        );
      }
    }

    const updated = await prisma.printJob.update({
      where: { id: jobId },
      data: { status: 'accepted', acceptedAt: new Date() },
    });

    if (job.user && process.env.RESEND_API_KEY) {
      sendJobStatusUpdateEmail(
        job.user.email,
        job.user.name,
        job.fileName,
        'Tu trabajo ha sido aceptado',
        'Un especialista ha revisado tu solicitud y la ha aceptado. La producción comenzará en breve.',
      ).catch((e) => console.error('Accept email error:', e));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Accept job error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

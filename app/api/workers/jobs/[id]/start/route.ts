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

    let cameraUrl: string | undefined;
    try {
      const body = await request.json();
      cameraUrl = body.cameraUrl || undefined;
    } catch { /* body is optional */ }

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

    if (job.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Debes aceptar el trabajo antes de iniciar la impresión' },
        { status: 400 }
      );
    }

    const updated = await prisma.printJob.update({
      where: { id: jobId },
      data: { status: 'printing', startedAt: new Date(), ...(cameraUrl ? { cameraUrl } : {}) },
    });

    if (job.user && process.env.RESEND_API_KEY) {
      const serviceBody: Record<string, string> = {
        design:   'Un diseñador ha comenzado a trabajar en tu proyecto. Te notificaremos cuando esté listo.',
        laser:    'Tu trabajo de corte láser ha comenzado. Puedes seguir el progreso en tu panel.',
        default:  'Tu trabajo ha comenzado a ser producido. Puedes seguir el progreso en tu panel.',
      };
      sendJobStatusUpdateEmail(
        job.user.email,
        job.user.name,
        job.fileName,
        'Producción iniciada',
        serviceBody[job.serviceType ?? ''] ?? serviceBody.default,
      ).catch((e) => console.error('Start email error:', e));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Start job error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

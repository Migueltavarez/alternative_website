import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

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
    const { trackingUrl } = await request.json();

    if (!trackingUrl || typeof trackingUrl !== 'string') {
      return NextResponse.json({ error: 'trackingUrl es requerido' }, { status: 400 });
    }

    const job = await prisma.printJob.findUnique({ where: { id: params.id } });

    if (!job) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    if (job.assignedWorkerId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (job.deliveryType !== 'delivery') {
      return NextResponse.json({ error: 'Este trabajo no tiene envío a domicilio' }, { status: 400 });
    }

    const updated = await prisma.printJob.update({
      where: { id: params.id },
      data: { trackingUrl, status: 'shipped' },
    });

    createNotification({
      userId: job.userId,
      type: 'job_update',
      title: 'Tu pedido está en camino',
      body: `El trabajo "${job.fileName}" fue enviado. Puedes seguir tu pedido con el link de tracking.`,
      link: '/dashboard?tab=servicios',
    }).catch(() => {});

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Tracking update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

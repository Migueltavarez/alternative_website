import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const { deliveryAddress, deliveryType } = await request.json();

    const job = await prisma.printJob.findUnique({ where: { id: params.id } });
    if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    if (job.userId !== userId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    if (job.status !== 'completed') return NextResponse.json({ error: 'Solo se puede confirmar entrega de trabajos completados' }, { status: 400 });

    const updated = await prisma.printJob.update({
      where: { id: params.id },
      data: {
        deliveryType: deliveryType || job.deliveryType,
        deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : job.deliveryAddress,
        status: 'ready_to_ship',
      },
    });

    if (job.assignedWorkerId) {
      createNotification({
        userId: job.assignedWorkerId,
        type: 'job_update',
        title: 'Cliente confirmó dirección de entrega',
        body: `El cliente confirmó la dirección para el trabajo "${job.fileName}". Puedes proceder con el envío.`,
        link: '/worker',
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Confirm delivery error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

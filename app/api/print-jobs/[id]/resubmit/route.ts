import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const { fileUrl, fileName, fileSize } = await request.json();

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: 'fileUrl y fileName son requeridos' }, { status: 400 });
    }

    const job = await prisma.printJob.findUnique({ where: { id } });

    if (!job) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }
    if (job.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    if (job.status !== 'needs_revision') {
      return NextResponse.json({ error: 'El trabajo no está en estado de revisión' }, { status: 400 });
    }

    const updated = await prisma.printJob.update({
      where: { id },
      data: {
        fileUrl,
        fileName,
        fileSize: fileSize ?? null,
        makerFeedback: null,
        status: 'assigned',
        assignedAt: new Date(),
        acceptedAt: null,
        startedAt: null,
      },
    });

    return NextResponse.json({ success: true, job: updated });
  } catch (error) {
    console.error('Resubmit error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

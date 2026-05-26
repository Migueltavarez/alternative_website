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
    const { issues, notes, suggestion } = await request.json();

    if (!issues?.length) {
      return NextResponse.json({ error: 'Selecciona al menos un problema' }, { status: 400 });
    }

    const job = await prisma.printJob.findUnique({ where: { id } });

    if (!job) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    if (job.assignedWorkerId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!['assigned', 'accepted', 'printing'].includes(job.status)) {
      return NextResponse.json({ error: 'No se puede reportar en este estado' }, { status: 400 });
    }

    const feedback = JSON.stringify({
      issues,
      notes: notes || '',
      suggestion: suggestion || '',
      submittedAt: new Date().toISOString(),
    });

    const updated = await prisma.printJob.update({
      where: { id },
      data: {
        makerFeedback: feedback,
        status: 'needs_revision',
      },
    });

    return NextResponse.json({ success: true, job: updated });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

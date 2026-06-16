import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existingUserIds = await prisma.user.findMany({ select: { id: true } }).then(u => u.map(u => u.id));
    const workers = await prisma.workerProfile.findMany({
      where: { userId: { in: existingUserIds } },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        machines: { orderBy: { createdAt: 'asc' } },
        _count: { select: { machines: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      workers.map((w) => ({
        ...w,
        machines: w.machines.map((m) => ({
          ...m,
          supportedColors: JSON.parse(m.supportedColors),
          supportedFilaments: JSON.parse(m.supportedFilaments),
          supportedNozzles: JSON.parse(m.supportedNozzles),
        })),
      }))
    );
  } catch (error) {
    console.error('Get all workers error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { workerId, isActive } = await request.json();
    if (!workerId || isActive === undefined) {
      return NextResponse.json({ error: 'workerId e isActive son requeridos' }, { status: 400 });
    }

    const updated = await prisma.workerProfile.update({
      where: { id: workerId },
      data: { isActive },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update worker error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

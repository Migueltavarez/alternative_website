import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { reassignStaleJobs } from '@/lib/queue';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Stale job check on every worker dashboard load
    try {
      await reassignStaleJobs();
    } catch (e) {
      console.error('Stale job check error:', e);
    }

    const jobs = await prisma.printJob.findMany({
      where: {
        assignedWorkerId: userId,
        status: { in: ['assigned', 'accepted', 'printing', 'completed', 'needs_revision'] },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedMachine: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Get worker jobs error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

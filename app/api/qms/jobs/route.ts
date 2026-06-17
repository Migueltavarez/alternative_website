import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET — list all jobs that have been initiated in QMS + summary counts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage'); // filter by qmsStage
  const all = searchParams.get('all') === '1'; // include non-QMS jobs

  const where = all ? {} : { qmsStage: stage ? stage : { not: null } };

  const jobs = await prisma.printJob.findMany({
    where: where as any,
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignedWorker: { select: { id: true, name: true } },
      qualityInspection: { select: { id: true } },
      qualityPhotos: { select: { id: true } },
      _count: { select: { productionLogs: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Stage counts for filter tabs
  const stageCounts = await prisma.printJob.groupBy({
    by: ['qmsStage'],
    _count: { id: true },
    where: { qmsStage: { not: null } },
  });

  return NextResponse.json({ jobs, stageCounts });
}

// POST — initiate QMS on a job
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { jobId } = await request.json();
  if (!jobId) return NextResponse.json({ error: 'jobId requerido' }, { status: 400 });

  const job = await prisma.printJob.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
  if (job.qmsStage) return NextResponse.json({ error: 'El QMS ya fue iniciado para este trabajo' }, { status: 400 });

  const userId = (session.user as any).id;
  const userName = (session.user as any).name || session.user.email || 'Admin';

  const [updatedJob] = await prisma.$transaction([
    prisma.printJob.update({
      where: { id: jobId },
      data: { qmsStage: 'file_validation' },
    }),
    prisma.qualityInspection.create({
      data: { printJobId: jobId, initiatedBy: userId },
    }),
    prisma.productionLog.create({
      data: {
        printJobId: jobId,
        stage: 'file_validation',
        action: 'QMS iniciado',
        toStage: 'file_validation',
        userId,
        userName,
        comment: 'Sistema de Control de Calidad iniciado',
      },
    }),
  ]);

  return NextResponse.json(updatedJob);
}

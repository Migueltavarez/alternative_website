import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET — full QMS data for a job (inspection + photos + logs)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const job = await prisma.printJob.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      assignedWorker: { select: { id: true, name: true, email: true } },
      assignedMachine: { select: { id: true, name: true, machineType: true } },
      qualityInspection: true,
      qualityPhotos: { orderBy: { createdAt: 'asc' } },
      productionLogs: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });

  return NextResponse.json(job);
}

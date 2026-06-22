import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/print-jobs/[id]/designer-earnings — body: { amount: number }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { amount } = await request.json();

  if (typeof amount !== 'number' || amount < 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
  }

  const job = await prisma.printJob.findUnique({
    where: { id: params.id },
    select: { serviceType: true, assignedWorkerId: true },
  });

  if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
  if (job.serviceType !== 'design') {
    return NextResponse.json({ error: 'Solo aplica para trabajos de diseño' }, { status: 400 });
  }

  const updated = await prisma.printJob.update({
    where: { id: params.id },
    data: { designerEarnings: amount },
  });

  return NextResponse.json({ success: true, designerEarnings: updated.designerEarnings });
}

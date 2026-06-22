import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/print-jobs/[id]/designer-paid — marks the designer as paid for this job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const job = await prisma.printJob.findUnique({
    where: { id: params.id },
    select: { serviceType: true, designerEarnings: true, designerPaid: true },
  });

  if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
  if (job.serviceType !== 'design') {
    return NextResponse.json({ error: 'Solo aplica para trabajos de diseño' }, { status: 400 });
  }
  if (!job.designerEarnings) {
    return NextResponse.json({ error: 'No hay monto de ganancia configurado' }, { status: 400 });
  }

  const updated = await prisma.printJob.update({
    where: { id: params.id },
    data: { designerPaid: true, designerPaidAt: new Date() },
  });

  return NextResponse.json({ success: true, designerPaidAt: updated.designerPaidAt });
}

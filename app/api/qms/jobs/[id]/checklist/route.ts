import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST — save checklist data for the current stage
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const job = await prisma.printJob.findUnique({
    where: { id: params.id },
    include: { qualityInspection: true },
  });
  if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });

  if (role !== 'ADMIN' && job.assignedWorkerId !== userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  if (!job.qmsStage) return NextResponse.json({ error: 'QMS no iniciado' }, { status: 400 });
  if (!job.qualityInspection) return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 });

  const { stage, data } = await request.json();
  if (stage !== job.qmsStage) {
    return NextResponse.json({ error: 'El stage enviado no coincide con el actual' }, { status: 400 });
  }

  const userName = (session.user as any).name || session.user.email || 'Maker';
  const dataStr = JSON.stringify(data);

  const fieldMap: Record<string, string> = {
    file_validation: 'fileValidation',
    print_setup:     'printSetup',
    in_production:   'productionData',
    post_processing: 'postProcessing',
    quality_check:   'qualityScore',
  };

  const field = fieldMap[stage];
  if (!field) return NextResponse.json({ error: 'Stage inválido' }, { status: 400 });

  const [inspection] = await prisma.$transaction([
    prisma.qualityInspection.update({
      where: { id: job.qualityInspection.id },
      data: { [field]: dataStr },
    }),
    prisma.productionLog.create({
      data: {
        printJobId: params.id,
        stage,
        action: 'Checklist guardado',
        userId,
        userName,
        comment: `Datos del checklist de ${stage} actualizados`,
      },
    }),
  ]);

  return NextResponse.json(inspection);
}

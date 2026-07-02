import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { STAGE_FLOW, getQcClassification } from '@/lib/qms-constants';
import { sendJobStatusUpdateEmail } from '@/lib/email';

function isChecklistComplete(stage: string, inspection: any): { ok: boolean; reason?: string } {
  try {
    if (stage === 'file_validation') {
      const data = inspection.fileValidation ? JSON.parse(inspection.fileValidation) : null;
      if (!data) return { ok: false, reason: 'Completa el checklist de validación' };
      if (!data.status) return { ok: false, reason: 'Indica el estado (Aprobado/Requiere corrección/Rechazado)' };
      if (data.status === 'rejected') return { ok: false, reason: 'El archivo fue rechazado. Usa "Rehacer" o resuelve el problema primero.' };
      const allChecked = Object.values(data.checks || {}).every(Boolean);
      if (!allChecked && data.status === 'approved') return { ok: false, reason: 'Completa todos los ítems del checklist' };
    }
    if (stage === 'print_setup') {
      const data = inspection.printSetup ? JSON.parse(inspection.printSetup) : null;
      if (!data) return { ok: false, reason: 'Completa el checklist de preparación' };
      const allChecked = Object.values(data.checks || {}).every(Boolean);
      if (!allChecked) return { ok: false, reason: 'Completa todos los ítems del checklist' };
      if (!data.printer || !data.operator) return { ok: false, reason: 'Indica la impresora y el operador' };
    }
    if (stage === 'in_production') {
      const data = inspection.productionData ? JSON.parse(inspection.productionData) : null;
      if (!data) return { ok: false, reason: 'Registra los datos de producción' };
      if (!data.firstLayerCheck) return { ok: false, reason: 'Registra la inspección de primera capa' };
    }
    if (stage === 'post_processing') {
      const data = inspection.postProcessing ? JSON.parse(inspection.postProcessing) : null;
      if (!data) return { ok: false, reason: 'Completa el checklist de post-procesado' };
    }
    if (stage === 'quality_check') {
      const data = inspection.qualityScore ? JSON.parse(inspection.qualityScore) : null;
      if (!data) return { ok: false, reason: 'Completa la puntuación de calidad' };
      const total = data.total ?? 0;
      const { canProceed, label } = getQcClassification(total);
      if (!canProceed) return { ok: false, reason: `Puntuación ${total}/100 (${label}) — mínimo 85 para aprobar` };
    }
  } catch {
    return { ok: false, reason: 'Error al validar el checklist' };
  }
  return { ok: true };
}

// POST — advance to next QMS stage (admin or the assigned maker)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const userName = (session.user as any).name || session.user.email || 'Usuario';
  const { comment, forceRedo } = await request.json().catch(() => ({}));

  const job = await prisma.printJob.findUnique({
    where: { id: params.id },
    include: { qualityInspection: true, user: { select: { email: true, name: true } } },
  });
  if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
  if (role !== 'ADMIN' && job.assignedWorkerId !== userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  if (!job.qmsStage) return NextResponse.json({ error: 'QMS no iniciado' }, { status: 400 });

  const fromStage = job.qmsStage;
  const toStage = forceRedo ? 'redo' : STAGE_FLOW[fromStage];

  if (!toStage && fromStage !== 'delivered') {
    return NextResponse.json({ error: 'No hay siguiente etapa' }, { status: 400 });
  }
  if (fromStage === 'delivered') {
    return NextResponse.json({ error: 'El pedido ya fue entregado' }, { status: 400 });
  }

  // Validate checklist completeness before advancing (unless forcing redo)
  if (!forceRedo && job.qualityInspection) {
    const { ok, reason } = isChecklistComplete(fromStage, job.qualityInspection);
    if (!ok) return NextResponse.json({ error: reason }, { status: 422 });
  }

  const nextStage = toStage!;

  const extraData: any = {};
  if (nextStage === 'delivered') {
    extraData.deliveredAt = new Date();
    extraData.status = 'completed';
  }
  if (nextStage === 'ready') {
    extraData.status = 'completed';
  }

  const [updated] = await prisma.$transaction([
    prisma.printJob.update({
      where: { id: params.id },
      data: { qmsStage: nextStage, ...extraData },
    }),
    prisma.productionLog.create({
      data: {
        printJobId: params.id,
        stage: nextStage,
        action: forceRedo ? 'Enviado a Rehacer' : `Avanzado a ${nextStage}`,
        fromStage,
        toStage: nextStage,
        userId,
        userName,
        comment: comment || null,
      },
    }),
  ]);

  // Email to client on key transitions
  if (job.user?.email && process.env.RESEND_API_KEY) {
    const emailMap: Record<string, { subject: string; body: string } | null> = {
      quality_check: { subject: 'Tu pedido pasó al Control de Calidad', body: 'Tu pedido está siendo inspeccionado en nuestro control de calidad final.' },
      ready: { subject: '¡Tu pedido está listo para entrega!', body: 'Tu pedido superó el control de calidad y está listo para ser recogido o enviado.' },
      delivered: { subject: '¡Tu pedido fue entregado!', body: 'Gracias por confiar en nosotros. Tu pedido ha sido entregado exitosamente.' },
      redo: { subject: 'Tu pedido está siendo rehecho', body: 'Detectamos un problema en el control de calidad. Estamos rehaciendo tu pedido sin costo adicional.' },
    };
    const emailInfo = emailMap[nextStage];
    if (emailInfo) {
      sendJobStatusUpdateEmail(job.user.email, job.user.name, job.fileName, emailInfo.subject, emailInfo.body)
        .catch(() => {});
    }
  }

  return NextResponse.json(updated);
}

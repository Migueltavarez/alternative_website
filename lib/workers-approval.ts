import prisma from '@/lib/prisma';
import { sendWorkerApprovedEmail, sendWorkerRejectedEmail } from '@/lib/email';

/**
 * Aprobar o rechazar un Maker o diseñador nuevo. Lo usan tanto el panel /admin como la API de
 * integración (n8n), para que hagan exactamente lo mismo.
 */

export type ApprovalResult =
  | { ok: true; action: 'approved' | 'rejected' }
  | { ok: false; status: 404 | 409; error: string };

async function findCandidate(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, workerApproved: true },
  });
}

export async function approveWorker(userId: string): Promise<ApprovalResult> {
  const user = await findCandidate(userId);
  if (!user || !['WORKER', 'DESIGNER'].includes(user.role)) {
    return { ok: false, status: 404, error: 'Usuario no encontrado o no es worker/designer' };
  }
  if (user.workerApproved) {
    return { ok: false, status: 409, error: 'Ya estaba aprobado' };
  }
  await prisma.user.update({ where: { id: userId }, data: { workerApproved: true } });
  // El correo no debe tumbar la aprobación.
  sendWorkerApprovedEmail(user.email, user.name, user.role).catch((e: unknown) =>
    console.warn('[workers] no se pudo enviar el correo de aprobación:', e instanceof Error ? e.message : e),
  );
  return { ok: true, action: 'approved' };
}

export async function rejectWorker(userId: string, reason?: string | null): Promise<ApprovalResult> {
  const user = await findCandidate(userId);
  if (!user || !['WORKER', 'DESIGNER'].includes(user.role)) {
    return { ok: false, status: 404, error: 'Usuario no encontrado o no es worker/designer' };
  }
  // Se borra el perfil de Maker y vuelve a ser un usuario normal.
  await prisma.$transaction([
    prisma.workerProfile.deleteMany({ where: { userId } }),
    prisma.user.update({ where: { id: userId }, data: { role: 'USER', workerApproved: false } }),
  ]);
  sendWorkerRejectedEmail(user.email, user.name, reason ?? null).catch((e: unknown) =>
    console.warn('[workers] no se pudo enviar el correo de rechazo:', e instanceof Error ? e.message : e),
  );
  return { ok: true, action: 'rejected' };
}

/** Makers y diseñadores que esperan aprobación, con sus equipos. */
export function listPendingWorkers() {
  return prisma.user.findMany({
    where: { role: { in: ['WORKER', 'DESIGNER'] }, workerApproved: false },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      workerProfile: {
        select: {
          id: true,
          createdAt: true,
          machines: {
            select: {
              id: true,
              name: true,
              description: true,
              machineType: true,
              supportedFilaments: true,
              supportedColors: true,
              supportedNozzles: true,
              laserType: true,
              dimensions: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { approveWorker, rejectWorker } from '@/lib/workers-approval';

// POST /api/admin/workers/[id] — body: { action: 'approve' | 'reject', reason?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { action, reason } = await request.json();
  const userId = params.id;

  const result =
    action === 'approve'
      ? await approveWorker(userId)
      : action === 'reject'
        ? await rejectWorker(userId, typeof reason === 'string' ? reason : null)
        : null;
  if (!result) return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, action: result.action });
}

// DELETE /api/admin/workers/[id] — eliminar maker permanentemente
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = params.id;

  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId },
    include: { machines: { select: { id: true } } },
  });

  if (!workerProfile) {
    return NextResponse.json({ error: 'Perfil de maker no encontrado' }, { status: 404 });
  }

  const machineIds = workerProfile.machines.map((m) => m.id);

  // Nullify machine references on print jobs to avoid FK constraint errors
  if (machineIds.length > 0) {
    await prisma.printJob.updateMany({
      where: { assignedMachineId: { in: machineIds } },
      data: { assignedMachineId: null },
    });
  }

  await prisma.$transaction([
    prisma.workerProfile.delete({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { workerApproved: false },
    }),
  ]);

  return NextResponse.json({ success: true });
}

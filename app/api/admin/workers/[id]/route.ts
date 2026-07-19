import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/workers/[id] — body: { action: 'approve' | 'reject' }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { action } = await request.json();
  const userId = params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, workerApproved: true },
  });

  if (!user || !['WORKER', 'DESIGNER'].includes(user.role)) {
    return NextResponse.json({ error: 'Usuario no encontrado o no es worker/designer' }, { status: 404 });
  }

  if (action === 'approve') {
    await prisma.user.update({
      where: { id: userId },
      data: { workerApproved: true },
    });
    return NextResponse.json({ success: true, action: 'approved' });
  }

  if (action === 'reject') {
    // Remove worker profile and reset role to USER
    await prisma.$transaction([
      prisma.workerProfile.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: { role: 'USER', workerApproved: false },
      }),
    ]);
    return NextResponse.json({ success: true, action: 'rejected' });
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
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

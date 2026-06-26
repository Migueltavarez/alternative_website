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

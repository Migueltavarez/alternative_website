import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'DESIGNER' && user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const jobs = await prisma.printJob.findMany({
    where: {
      assignedWorkerId: userId,
      serviceType: 'design',
      status: { in: ['completed', 'printing', 'accepted'] },
    },
    select: {
      id: true,
      fileName: true,
      status: true,
      designerEarnings: true,
      designerPaid: true,
      designerPaidAt: true,
      completedAt: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const pendingBalance = jobs
    .filter((j) => !j.designerPaid && j.designerEarnings)
    .reduce((sum, j) => sum + (j.designerEarnings ?? 0), 0);

  const totalEarned = jobs
    .filter((j) => j.designerPaid && j.designerEarnings)
    .reduce((sum, j) => sum + (j.designerEarnings ?? 0), 0);

  return NextResponse.json({ jobs, pendingBalance, totalEarned });
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MAKER_EARNING_PER_CREDIT } from '@/lib/credits';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

  if (!user || (user.role !== 'DESIGNER' && user.role !== 'WORKER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // DESIGNER: earnings set manually by admin (designerEarnings field)
  if (user.role === 'DESIGNER') {
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
        creditsCost: true,
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

    return NextResponse.json({ type: 'designer', jobs, pendingBalance, totalEarned });
  }

  // WORKER/ADMIN: earnings auto-calculated from creditsCost × MAKER_EARNING_PER_CREDIT
  const jobs = await prisma.printJob.findMany({
    where: {
      assignedWorkerId: userId,
      status: 'completed',
      serviceType: { not: 'design' },
    },
    select: {
      id: true,
      fileName: true,
      serviceType: true,
      status: true,
      creditsCost: true,
      makerPaid: true,
      makerPaidAt: true,
      completedAt: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { completedAt: 'desc' },
  });

  const pendingCredits = jobs
    .filter((j) => !j.makerPaid)
    .reduce((sum, j) => sum + j.creditsCost, 0);

  const paidCredits = jobs
    .filter((j) => j.makerPaid)
    .reduce((sum, j) => sum + j.creditsCost, 0);

  const totalCredits = jobs.reduce((sum, j) => sum + j.creditsCost, 0);

  const pendingBalance = pendingCredits * MAKER_EARNING_PER_CREDIT;
  const totalEarned = paidCredits * MAKER_EARNING_PER_CREDIT;

  return NextResponse.json({
    type: 'maker',
    jobs: jobs.map((j) => ({
      ...j,
      makerEarnings: j.creditsCost * MAKER_EARNING_PER_CREDIT,
    })),
    pendingCredits,
    paidCredits,
    totalCredits,
    pendingBalance,
    totalEarned,
    earningPerCredit: MAKER_EARNING_PER_CREDIT,
  });
}

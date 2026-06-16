import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [totalJobs, completedJobs, byService] = await Promise.all([
    prisma.printJob.count(),
    prisma.printJob.count({ where: { status: 'completed' } }),
    prisma.printJob.groupBy({
      by: ['serviceType'],
      _count: { id: true },
      where: { status: 'completed' },
    }),
  ]);

  const serviceBreakdown = byService.reduce((acc, row) => {
    acc[row.serviceType ?? 'print_3d'] = row._count.id;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({ totalJobs, completedJobs, serviceBreakdown });
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function getWeekLabel(d: Date): string {
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const dd = String(start.getDate()).padStart(2, '0');
  return `${start.getFullYear()}-${mm}-${dd}`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const [recentJobs, workers, allPaidJobs, totalJobs, activeWorkers, ratedJobs] = await Promise.all([
    prisma.printJob.findMany({
      where: { createdAt: { gte: twelveWeeksAgo } },
      select: { id: true, createdAt: true, serviceType: true, status: true },
    }),
    prisma.workerProfile.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { completedJobs: 'desc' },
      take: 5,
    }),
    prisma.printJob.findMany({
      where: { paidAt: { not: null } },
      select: { price: true, paidAt: true },
    }),
    prisma.printJob.count(),
    prisma.workerProfile.count({ where: { isActive: true } }),
    prisma.printJob.findMany({ where: { rating: { not: null } }, select: { rating: true } }),
  ]);

  // Jobs per week (last 8)
  const weekMap: Record<string, number> = {};
  for (const job of recentJobs) {
    const key = getWeekLabel(new Date(job.createdAt));
    weekMap[key] = (weekMap[key] ?? 0) + 1;
  }
  const jobsPerWeek = Object.entries(weekMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([week, count]) => ({ week, count }));

  // By service type
  const serviceMap: Record<string, number> = {};
  for (const job of recentJobs) {
    const s = job.serviceType ?? 'print_3d';
    serviceMap[s] = (serviceMap[s] ?? 0) + 1;
  }
  const byServiceType = Object.entries(serviceMap).map(([service, count]) => ({ service, count }));

  // Revenue per month (last 6)
  const monthMap: Record<string, number> = {};
  for (const job of allPaidJobs) {
    if (!job.paidAt || !job.price) continue;
    const d = new Date(job.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = (monthMap[key] ?? 0) + job.price;
  }
  const revenuePerMonth = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }));

  const topMakers = workers.map(w => ({
    name: w.user.name ?? 'Sin nombre',
    completedJobs: w.completedJobs,
  }));

  const totalRevenue = allPaidJobs.reduce((sum, j) => sum + (j.price ?? 0), 0);
  const avgRating = ratedJobs.length
    ? ratedJobs.reduce((sum, j) => sum + (j.rating ?? 0), 0) / ratedJobs.length
    : 0;

  return NextResponse.json({
    jobsPerWeek,
    byServiceType,
    revenuePerMonth,
    topMakers,
    summary: {
      totalJobs,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeWorkers,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratedJobs.length,
    },
  });
}

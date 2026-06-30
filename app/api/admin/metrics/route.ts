import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import os from 'os';

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

  const now = new Date();
  const twelveWeeksAgo = new Date(now); twelveWeeksAgo.setDate(now.getDate() - 84);
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);

  const [
    recentJobs,
    workers,
    allPaidJobs,
    totalJobs,
    activeWorkers,
    ratedJobs,
    // Users
    totalUsers,
    usersByRole,
    newUsersWeek,
    newUsersMonth,
    pendingWorkerCount,
    // Jobs extended
    jobsByStatus,
    jobsByPriceStatus,
    autoQuotedCount,
    avgPriceResult,
    // Subscriptions
    activeSubscriptions,
    subscriptionsByPlan,
    // Credits
    creditTotals,
    totalCreditPurchases,
    // Notifications
    totalNotifications,
    unreadNotifications,
  ] = await Promise.all([
    prisma.printJob.findMany({
      where: { createdAt: { gte: twelveWeeksAgo }, user: {} },
      select: { id: true, createdAt: true, serviceType: true, status: true },
    }),
    prisma.workerProfile.findMany({
      where: { user: {} },
      include: { user: { select: { name: true } } },
      orderBy: { completedJobs: 'desc' },
      take: 5,
    }),
    prisma.printJob.findMany({
      where: { paidAt: { not: null }, user: {} },
      select: { price: true, paidAt: true },
    }),
    prisma.printJob.count({ where: { user: {} } }),
    prisma.workerProfile.count({ where: { isActive: true, user: {} } }),
    prisma.printJob.findMany({ where: { rating: { not: null }, user: {} }, select: { rating: true } }),
    // Users
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { role: { in: ['WORKER', 'DESIGNER'] }, workerApproved: false } }),
    // Jobs extended
    prisma.printJob.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.printJob.groupBy({ by: ['priceStatus'], _count: { _all: true } }),
    prisma.printJob.count({ where: { autoQuoted: true } }),
    prisma.printJob.aggregate({ where: { price: { not: null } }, _avg: { price: true } }),
    // Subscriptions
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.groupBy({ by: ['plan'], _count: { _all: true }, where: { status: 'active' } }),
    // Credits
    prisma.creditPurchase.aggregate({ _sum: { credits: true, amount: true }, where: { status: 'completed' } }),
    prisma.creditPurchase.count({ where: { status: 'pending' } }),
    // Notifications
    prisma.notification.count(),
    prisma.notification.count({ where: { read: false } }),
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

  // Server resources
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const proc = process.memoryUsage();

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
    users: {
      total: totalUsers,
      byRole: Object.fromEntries(usersByRole.map(r => [r.role, r._count._all])),
      newThisWeek: newUsersWeek,
      newThisMonth: newUsersMonth,
      pendingApproval: pendingWorkerCount,
    },
    jobs: {
      byStatus: Object.fromEntries(jobsByStatus.map(s => [s.status, s._count._all])),
      byPriceStatus: Object.fromEntries(jobsByPriceStatus.map(s => [s.priceStatus, s._count._all])),
      autoQuoted: autoQuotedCount,
      manuallyQuoted: totalJobs - autoQuotedCount,
      avgPrice: Math.round((avgPriceResult._avg.price ?? 0) * 100) / 100,
    },
    subscriptions: {
      active: activeSubscriptions,
      byPlan: Object.fromEntries(subscriptionsByPlan.map(s => [s.plan, s._count._all])),
    },
    credits: {
      totalIssued: creditTotals._sum.credits ?? 0,
      totalRevenue: Math.round((creditTotals._sum.amount ?? 0) * 100) / 100,
      pendingPurchases: totalCreditPurchases,
    },
    notifications: {
      total: totalNotifications,
      unread: unreadNotifications,
    },
    server: {
      memory: {
        totalMB: Math.round(totalMem / 1024 / 1024),
        usedMB: Math.round(usedMem / 1024 / 1024),
        freeMB: Math.round(freeMem / 1024 / 1024),
        usedPct: Math.round((usedMem / totalMem) * 100),
      },
      process: {
        heapUsedMB: Math.round(proc.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(proc.heapTotal / 1024 / 1024),
        rssMB: Math.round(proc.rss / 1024 / 1024),
      },
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model ?? 'N/A',
        loadAvg1: Math.round(loadAvg[0] * 100) / 100,
        loadAvg5: Math.round(loadAvg[1] * 100) / 100,
        loadAvg15: Math.round(loadAvg[2] * 100) / 100,
      },
      uptimeHours: Math.round(os.uptime() / 3600 * 10) / 10,
      nodeVersion: process.version,
      platform: os.platform(),
    },
  });
}

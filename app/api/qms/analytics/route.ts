import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getQcClassification } from '@/lib/qms-constants';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [allQmsJobs, monthJobs, inspections, logs] = await Promise.all([
    prisma.printJob.findMany({
      where: { qmsStage: { not: null } },
      select: { id: true, qmsStage: true, serviceType: true, createdAt: true, deliveredAt: true, completedAt: true },
    }),
    prisma.printJob.findMany({
      where: { qmsStage: { not: null }, createdAt: { gte: startOfMonth } },
      select: { id: true, qmsStage: true },
    }),
    prisma.qualityInspection.findMany({
      where: { qualityScore: { not: null } },
      select: { qualityScore: true, printJobId: true },
    }),
    prisma.productionLog.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { stage: true, action: true, fromStage: true, toStage: true, userName: true, createdAt: true },
    }),
  ]);

  // Monthly stage distribution
  const stageCount = monthJobs.reduce((acc, j) => {
    acc[j.qmsStage ?? 'unknown'] = (acc[j.qmsStage ?? 'unknown'] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // QC score analytics
  const scores = inspections.map(i => {
    try { return JSON.parse(i.qualityScore!); } catch { return null; }
  }).filter(Boolean);

  const approvedCount = scores.filter(s => getQcClassification(s.total).canProceed).length;
  const redoCount = scores.filter(s => !getQcClassification(s.total).canProceed).length;
  const avgScore = scores.length ? Math.round(scores.reduce((sum, s) => sum + s.total, 0) / scores.length) : 0;

  // Defect frequency
  const defectCount: Record<string, number> = {};
  for (const s of scores) {
    for (const d of (s.defects || [])) {
      defectCount[d] = (defectCount[d] ?? 0) + 1;
    }
  }
  const topDefects = Object.entries(defectCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => ({ key, count }));

  // Avg production time (completedAt - startedAt) from production data
  const productionTimes: number[] = [];
  for (const insp of inspections) {
    try {
      const job = allQmsJobs.find(j => j.id === insp.printJobId);
      if (job?.completedAt && job.createdAt) {
        const ms = new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime();
        productionTimes.push(ms / 3600000); // hours
      }
    } catch {}
  }
  const avgProductionHours = productionTimes.length
    ? Math.round(productionTimes.reduce((a, b) => a + b, 0) / productionTimes.length * 10) / 10
    : 0;

  // Weekly job volume (last 8 weeks)
  const weekMap: Record<string, number> = {};
  for (const job of allQmsJobs) {
    const d = new Date(job.createdAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    weekMap[key] = (weekMap[key] ?? 0) + 1;
  }
  const weeklyVolume = Object.entries(weekMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([week, count]) => ({ week: week.slice(5), count }));

  // Redo transitions this month
  const redoTransitions = logs.filter(l => l.toStage === 'redo').length;

  return NextResponse.json({
    summary: {
      totalQms: allQmsJobs.length,
      monthTotal: monthJobs.length,
      approved: approvedCount,
      redo: redoCount,
      approvalRate: scores.length ? Math.round((approvedCount / scores.length) * 100) : 0,
      avgScore,
      avgProductionHours,
      redoTransitions,
    },
    stageCount,
    topDefects,
    weeklyVolume,
  });
}

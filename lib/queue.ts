import prisma from './prisma';
import { SERVICE_MACHINE_TYPES } from './print-constants';

const ASSIGNMENT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

interface ExcludeOptions {
  machineId?: string;
  workerId?: string;
}

async function assignDesignJobToDesigner(jobId: string, excludeWorkerId?: string): Promise<string | null> {
  const designers = await prisma.workerProfile.findMany({
    where: {
      isActive: true,
      user: { role: 'DESIGNER' },
      ...(excludeWorkerId ? { userId: { not: excludeWorkerId } } : {}),
    },
    select: { userId: true },
  });

  if (designers.length === 0) return null;

  const withCounts = await Promise.all(
    designers.map(async (d) => {
      const activeCount = await prisma.printJob.count({
        where: { assignedWorkerId: d.userId, status: { in: ['assigned', 'accepted', 'printing'] } },
      });
      return { userId: d.userId, activeCount };
    })
  );

  withCounts.sort((a, b) => a.activeCount - b.activeCount);
  const selected = withCounts[0];

  await prisma.printJob.update({
    where: { id: jobId },
    data: {
      assignedWorkerId: selected.userId,
      assignedMachineId: null,
      assignedAt: new Date(),
      status: 'assigned',
    },
  });

  return selected.userId;
}

async function assignJobToMachine(
  jobId: string,
  job: { serviceType: string; color: string | null; filamentType: string | null },
  excludeMachineId?: string
): Promise<string | null> {
  const requiredTypes = SERVICE_MACHINE_TYPES[job.serviceType ?? 'print_3d'];

  // Find all active machines from active workers, filtered by the equipment
  // type the service requires (null/undefined means any type — legacy jobs like 'plans').
  const machines = await prisma.printerMachine.findMany({
    where: {
      isActive: true,
      ...(excludeMachineId ? { id: { not: excludeMachineId } } : {}),
      workerProfile: { isActive: true },
      ...(requiredTypes && requiredTypes.length > 0 ? { machineType: { in: requiredTypes } } : {}),
    },
    include: {
      workerProfile: { select: { userId: true } },
    },
  });

  if (machines.length === 0) return null;

  // Filter machines that can fulfill color + filament requirements
  const eligible = machines.filter((m) => {
    const colors: string[] = JSON.parse(m.supportedColors);
    const filaments: string[] = JSON.parse(m.supportedFilaments);
    const colorOk = !job.color || colors.includes(job.color);
    const filamentOk = !job.filamentType || filaments.includes(job.filamentType);
    return colorOk && filamentOk;
  });

  if (eligible.length === 0) return null;

  // Count active jobs per machine
  const withCounts = await Promise.all(
    eligible.map(async (m) => {
      const activeCount = await prisma.printJob.count({
        where: {
          assignedMachineId: m.id,
          status: { in: ['assigned', 'accepted', 'printing'] },
        },
      });
      return { machine: m, activeCount };
    })
  );

  // Pick machine with fewest active jobs; tie-break by oldest machine
  withCounts.sort((a, b) => {
    if (a.activeCount !== b.activeCount) return a.activeCount - b.activeCount;
    return a.machine.createdAt.getTime() - b.machine.createdAt.getTime();
  });

  const selected = withCounts[0].machine;

  await prisma.printJob.update({
    where: { id: jobId },
    data: {
      assignedWorkerId: selected.workerProfile.userId,
      assignedMachineId: selected.id,
      assignedAt: new Date(),
      status: 'assigned',
    },
  });

  return selected.workerProfile.userId;
}

export async function assignJobToWorker(
  jobId: string,
  exclude?: ExcludeOptions
): Promise<string | null> {
  const job = await prisma.printJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== 'pending') return null;

  if (job.serviceType === 'design') {
    return assignDesignJobToDesigner(jobId, exclude?.workerId);
  }

  return assignJobToMachine(jobId, job, exclude?.machineId);
}

export async function reassignStaleJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - ASSIGNMENT_TIMEOUT_MS);

  const stale = await prisma.printJob.findMany({
    where: {
      status: 'assigned',
      assignedAt: { lt: cutoff },
      acceptedAt: null,
    },
  });

  for (const job of stale) {
    const previousMachineId = job.assignedMachineId;
    const previousWorkerId = job.assignedWorkerId;

    await prisma.printJob.update({
      where: { id: job.id },
      data: {
        status: 'pending',
        assignedWorkerId: null,
        assignedMachineId: null,
        assignedAt: null,
      },
    });

    await assignJobToWorker(job.id, {
      machineId: previousMachineId ?? undefined,
      workerId: previousWorkerId ?? undefined,
    });
  }

  return stale.length;
}

export async function processQueue(): Promise<number> {
  await reassignStaleJobs();

  const pending = await prisma.printJob.findMany({
    where: { status: 'pending', assignedWorkerId: null },
    orderBy: { createdAt: 'asc' },
  });

  let assigned = 0;
  for (const job of pending) {
    const workerId = await assignJobToWorker(job.id);
    if (workerId) assigned++;
  }

  return assigned;
}

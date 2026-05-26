import prisma from './prisma';

const ASSIGNMENT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export async function assignJobToWorker(
  jobId: string,
  excludeMachineId?: string
): Promise<string | null> {
  const job = await prisma.printJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== 'pending') return null;

  // Find all active machines from active workers
  const machines = await prisma.printerMachine.findMany({
    where: {
      isActive: true,
      ...(excludeMachineId ? { id: { not: excludeMachineId } } : {}),
      workerProfile: { isActive: true },
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
    const previousMachine = job.assignedMachineId;

    await prisma.printJob.update({
      where: { id: job.id },
      data: {
        status: 'pending',
        assignedWorkerId: null,
        assignedMachineId: null,
        assignedAt: null,
      },
    });

    await assignJobToWorker(job.id, previousMachine ?? undefined);
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

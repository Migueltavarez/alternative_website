import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function fetchOctoprint(baseUrl: string, apiKey: string, path: string) {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    headers: { 'X-Api-Key': apiKey },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const jobId = params.jobId;

    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
      include: {
        assignedMachine: {
          select: { octoprintUrl: true, octoprintApiKey: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Allow: job owner or assigned worker
    if (job.userId !== userId && job.assignedWorkerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const machine = job.assignedMachine;
    if (!machine?.octoprintUrl || !machine?.octoprintApiKey) {
      return NextResponse.json({ error: 'no_octoprint' }, { status: 404 });
    }

    const baseUrl = machine.octoprintUrl.replace(/\/$/, '');
    const apiKey = machine.octoprintApiKey;

    const [printerData, jobData, webcamData] = await Promise.allSettled([
      fetchOctoprint(baseUrl, apiKey, '/api/printer'),
      fetchOctoprint(baseUrl, apiKey, '/api/job'),
      fetchOctoprint(baseUrl, apiKey, '/api/webcam'),
    ]);

    const printer = printerData.status === 'fulfilled' ? printerData.value : null;
    const jobInfo = jobData.status === 'fulfilled' ? jobData.value : null;
    const webcam = webcamData.status === 'fulfilled' ? webcamData.value : null;

    // Build absolute stream / snapshot URLs
    const resolveUrl = (rel?: string) => {
      if (!rel) return null;
      if (rel.startsWith('http://') || rel.startsWith('https://')) return rel;
      return `${baseUrl}${rel.startsWith('/') ? '' : '/'}${rel}`;
    };

    const streamUrl = resolveUrl(webcam?.streamUrl);
    const snapshotUrl = resolveUrl(webcam?.snapshotUrl);

    return NextResponse.json({
      streamUrl,
      snapshotUrl,
      webcamEnabled: webcam?.webcamEnabled ?? false,
      state: printer?.state?.text ?? null,
      temps: {
        bedActual: printer?.temperature?.bed?.actual ?? null,
        bedTarget: printer?.temperature?.bed?.target ?? null,
        nozzleActual: printer?.temperature?.tool0?.actual ?? null,
        nozzleTarget: printer?.temperature?.tool0?.target ?? null,
      },
      progress: {
        completion: jobInfo?.progress?.completion ?? null,
        printTime: jobInfo?.progress?.printTime ?? null,
        printTimeLeft: jobInfo?.progress?.printTimeLeft ?? null,
        fileName: jobInfo?.job?.file?.name ?? null,
      },
    });
  } catch (error) {
    console.error('OctoPrint proxy error:', error);
    return NextResponse.json({ error: 'octoprint_unreachable' }, { status: 503 });
  }
}

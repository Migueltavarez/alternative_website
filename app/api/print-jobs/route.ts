import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { assignJobToWorker } from '@/lib/queue';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const printJobs = await prisma.printJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(printJobs);
  } catch (error) {
    console.error('Get print jobs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { fileName, fileUrl, fileSize, notes, color, filamentType, deliveryTime } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { error: 'fileName y fileUrl son requeridos' },
        { status: 400 }
      );
    }

    const printJob = await prisma.printJob.create({
      data: {
        userId,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        notes: notes || null,
        color: color || null,
        filamentType: filamentType || null,
        deliveryTime: deliveryTime || 'standard',
        status: 'pending',
        creditsCost: 0,
      },
    });

    // Trigger automatic queue assignment
    try {
      await assignJobToWorker(printJob.id);
    } catch (queueError) {
      // Non-fatal: job stays pending and will be picked up later
      console.error('Queue assignment error:', queueError);
    }

    return NextResponse.json(printJob, { status: 201 });
  } catch (error) {
    console.error('Create print job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

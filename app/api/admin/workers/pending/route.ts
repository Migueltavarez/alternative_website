import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const pending = await prisma.user.findMany({
    where: {
      role: { in: ['WORKER', 'DESIGNER'] },
      workerApproved: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      workerProfile: {
        select: {
          id: true,
          createdAt: true,
          machines: {
            select: {
              id: true,
              name: true,
              machineType: true,
              laserType: true,
              dimensions: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(pending);
}

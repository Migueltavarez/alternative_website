import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accepted } = await request.json();
    if (accepted !== true) {
      return NextResponse.json({ error: 'Debes aceptar el contrato para continuar' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const ip = getClientIp(request);

    // Upsert WorkerProfile with contract acceptance
    await prisma.workerProfile.upsert({
      where: { userId },
      create: {
        userId,
        contractAccepted: true,
        contractAcceptedAt: new Date(),
        contractAcceptedIp: ip,
      },
      update: {
        contractAccepted: true,
        contractAcceptedAt: new Date(),
        contractAcceptedIp: ip,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contract acceptance error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

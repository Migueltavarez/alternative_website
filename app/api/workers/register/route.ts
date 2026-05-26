import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { machineName, machineDescription, supportedColors, supportedFilaments, supportedNozzles } = body;

    if (!machineName) {
      return NextResponse.json({ error: 'El nombre de la máquina es requerido' }, { status: 400 });
    }
    if (!supportedColors?.length || !supportedFilaments?.length || !supportedNozzles?.length) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un color, tipo de filamento y tamaño de nozzle' },
        { status: 400 }
      );
    }

    const existing = await prisma.workerProfile.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: 'Ya estás registrado como maker' }, { status: 409 });
    }

    // Create profile + first machine + update role in one transaction
    const [profile] = await prisma.$transaction([
      prisma.workerProfile.create({
        data: {
          userId,
          machines: {
            create: {
              name: machineName,
              description: machineDescription || null,
              supportedColors: JSON.stringify(supportedColors),
              supportedFilaments: JSON.stringify(supportedFilaments),
              supportedNozzles: JSON.stringify(supportedNozzles),
            },
          },
        },
        include: { machines: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: 'WORKER' },
      }),
    ]);

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error) {
    console.error('Worker register error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

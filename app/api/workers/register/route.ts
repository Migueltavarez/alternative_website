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
    const {
      machineType = 'printer_3d',
      machineName,
      machineDescription,
      supportedColors,
      supportedFilaments,
      supportedNozzles,
      dimensions,
      laserType,
    } = body;

    if (!['printer_3d', 'resin', 'laser'].includes(machineType)) {
      return NextResponse.json({ error: 'Tipo de equipo inválido' }, { status: 400 });
    }
    if (!machineName) {
      return NextResponse.json({ error: 'El nombre del equipo es requerido' }, { status: 400 });
    }

    if (machineType === 'laser') {
      if (!dimensions || !laserType) {
        return NextResponse.json(
          { error: 'Indica las dimensiones y el tipo de láser del equipo' },
          { status: 400 }
        );
      }
    } else {
      if (!supportedColors?.length || !supportedFilaments?.length) {
        return NextResponse.json(
          { error: 'Debes seleccionar al menos un color y un tipo de material' },
          { status: 400 }
        );
      }
      if (machineType === 'printer_3d' && !supportedNozzles?.length) {
        return NextResponse.json(
          { error: 'Debes seleccionar al menos un tamaño de nozzle' },
          { status: 400 }
        );
      }
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (currentUser?.role === 'DESIGNER' || currentUser?.role === 'ADMIN') {
      return NextResponse.json(
        { error: `Tu cuenta ya tiene asignado el rol de ${currentUser.role === 'DESIGNER' ? 'Diseñador' : 'Administrador'}. Contacta al administrador si también deseas registrar equipo.` },
        { status: 409 }
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
              machineType,
              supportedColors: JSON.stringify(supportedColors ?? []),
              supportedFilaments: JSON.stringify(supportedFilaments ?? []),
              supportedNozzles: JSON.stringify(supportedNozzles ?? []),
              laserType: machineType === 'laser' ? laserType : null,
              dimensions: machineType === 'laser' ? dimensions : null,
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

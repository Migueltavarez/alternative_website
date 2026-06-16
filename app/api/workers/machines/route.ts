import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getWorkerProfile(userId: string) {
  return prisma.workerProfile.findUnique({ where: { userId } });
}

// GET all machines for the authenticated worker
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const userId = (session.user as any).id;
    const profile = await getWorkerProfile(userId);
    if (!profile) return NextResponse.json({ error: 'No tienes perfil de maker' }, { status: 404 });

    const machines = await prisma.printerMachine.findMany({
      where: { workerProfileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(
      machines.map((m) => ({
        ...m,
        supportedColors: JSON.parse(m.supportedColors),
        supportedFilaments: JSON.parse(m.supportedFilaments),
        supportedNozzles: JSON.parse(m.supportedNozzles),
      }))
    );
  } catch (error) {
    console.error('Get machines error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST — add a new machine
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const userId = (session.user as any).id;
    const profile = await getWorkerProfile(userId);
    if (!profile) return NextResponse.json({ error: 'No tienes perfil de maker' }, { status: 404 });

    const body = await request.json();
    const {
      name, description, machineType = 'printer_3d',
      supportedColors, supportedFilaments, supportedNozzles,
      octoprintUrl, octoprintApiKey, dimensions, laserType,
    } = body;

    if (!['printer_3d', 'resin', 'laser'].includes(machineType)) {
      return NextResponse.json({ error: 'Tipo de equipo inválido' }, { status: 400 });
    }
    if (!name) return NextResponse.json({ error: 'El nombre del equipo es requerido' }, { status: 400 });

    if (machineType === 'laser') {
      if (!dimensions || !laserType) {
        return NextResponse.json({ error: 'Indica las dimensiones y el tipo de láser del equipo' }, { status: 400 });
      }
    } else {
      if (!supportedColors?.length) return NextResponse.json({ error: 'Selecciona al menos un color' }, { status: 400 });
      if (!supportedFilaments?.length) return NextResponse.json({ error: 'Selecciona al menos un material' }, { status: 400 });
      if (machineType === 'printer_3d' && !supportedNozzles?.length) {
        return NextResponse.json({ error: 'Selecciona al menos un nozzle' }, { status: 400 });
      }
    }

    const machine = await prisma.printerMachine.create({
      data: {
        workerProfileId: profile.id,
        name,
        description: description || null,
        machineType,
        supportedColors: JSON.stringify(machineType === 'laser' ? [] : (supportedColors ?? [])),
        supportedFilaments: JSON.stringify(machineType === 'laser' ? [] : (supportedFilaments ?? [])),
        supportedNozzles: JSON.stringify(machineType === 'printer_3d' ? (supportedNozzles ?? []) : []),
        octoprintUrl: machineType === 'printer_3d' ? (octoprintUrl || null) : null,
        octoprintApiKey: machineType === 'printer_3d' ? (octoprintApiKey || null) : null,
        laserType: machineType === 'laser' ? laserType : null,
        dimensions: machineType === 'laser' ? dimensions : null,
      },
    });

    return NextResponse.json(
      {
        ...machine,
        supportedColors: JSON.parse(machine.supportedColors),
        supportedFilaments: JSON.parse(machine.supportedFilaments),
        supportedNozzles: JSON.parse(machine.supportedNozzles),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create machine error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

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
    const { name, description, supportedColors, supportedFilaments, supportedNozzles, octoprintUrl, octoprintApiKey } = body;

    if (!name) return NextResponse.json({ error: 'El nombre de la máquina es requerido' }, { status: 400 });
    if (!supportedColors?.length) return NextResponse.json({ error: 'Selecciona al menos un color' }, { status: 400 });
    if (!supportedFilaments?.length) return NextResponse.json({ error: 'Selecciona al menos un filamento' }, { status: 400 });
    if (!supportedNozzles?.length) return NextResponse.json({ error: 'Selecciona al menos un nozzle' }, { status: 400 });

    const machine = await prisma.printerMachine.create({
      data: {
        workerProfileId: profile.id,
        name,
        description: description || null,
        supportedColors: JSON.stringify(supportedColors),
        supportedFilaments: JSON.stringify(supportedFilaments),
        supportedNozzles: JSON.stringify(supportedNozzles),
        octoprintUrl: octoprintUrl || null,
        octoprintApiKey: octoprintApiKey || null,
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

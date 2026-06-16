import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getMachineForWorker(machineId: string, userId: string) {
  const profile = await prisma.workerProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  return prisma.printerMachine.findFirst({
    where: { id: machineId, workerProfileId: profile.id },
  });
}

// PATCH — update machine capabilities or status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const userId = (session.user as any).id;
    const machine = await getMachineForWorker(params.id, userId);
    if (!machine) return NextResponse.json({ error: 'Máquina no encontrada' }, { status: 404 });

    const body = await request.json();
    const {
      name, description, machineType, supportedColors, supportedFilaments, supportedNozzles,
      isActive, octoprintUrl, octoprintApiKey, dimensions, laserType,
    } = body;

    const updated = await prisma.printerMachine.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(machineType !== undefined && { machineType }),
        ...(supportedColors && { supportedColors: JSON.stringify(supportedColors) }),
        ...(supportedFilaments && { supportedFilaments: JSON.stringify(supportedFilaments) }),
        ...(supportedNozzles && { supportedNozzles: JSON.stringify(supportedNozzles) }),
        ...(isActive !== undefined && { isActive }),
        ...(octoprintUrl !== undefined && { octoprintUrl: octoprintUrl || null }),
        ...(octoprintApiKey !== undefined && { octoprintApiKey: octoprintApiKey || null }),
        ...(dimensions !== undefined && { dimensions: dimensions || null }),
        ...(laserType !== undefined && { laserType: laserType || null }),
      },
    });

    return NextResponse.json({
      ...updated,
      supportedColors: JSON.parse(updated.supportedColors),
      supportedFilaments: JSON.parse(updated.supportedFilaments),
      supportedNozzles: JSON.parse(updated.supportedNozzles),
    });
  } catch (error) {
    console.error('Update machine error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE — remove a machine (only if no active jobs assigned)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const userId = (session.user as any).id;
    const machine = await getMachineForWorker(params.id, userId);
    if (!machine) return NextResponse.json({ error: 'Máquina no encontrada' }, { status: 404 });

    const activeJobs = await prisma.printJob.count({
      where: {
        assignedMachineId: params.id,
        status: { in: ['assigned', 'accepted', 'printing'] },
      },
    });

    if (activeJobs > 0) {
      return NextResponse.json(
        { error: 'No puedes eliminar una máquina con trabajos activos' },
        { status: 409 }
      );
    }

    await prisma.printerMachine.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete machine error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

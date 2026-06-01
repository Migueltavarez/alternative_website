import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, appealNote } = body;

    if (!['accept', 'appeal'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const printJob = await prisma.printJob.findUnique({ where: { id } });

    if (!printJob) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    if (printJob.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (printJob.priceStatus !== 'quoted') {
      return NextResponse.json({ error: 'El precio no está en estado cotizado' }, { status: 400 });
    }

    const updateData: any = {};
    if (action === 'accept') {
      updateData.priceStatus = 'accepted';
    } else {
      if (!appealNote?.trim()) {
        return NextResponse.json({ error: 'Debes indicar el motivo de la apelación' }, { status: 400 });
      }
      updateData.priceStatus = 'appealed';
      updateData.appealNote = appealNote.trim();
    }

    const updated = await prisma.printJob.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Price decision error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

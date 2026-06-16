import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    let profile = await prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        machines: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Designers have no equipment to self-register; provision an empty
    // profile lazily so they can always access their panel.
    if (!profile && (session.user as any).role === 'DESIGNER') {
      profile = await prisma.workerProfile.create({
        data: { userId },
        include: { machines: true },
      });
    }

    if (!profile) return NextResponse.json({ profile: null });

    return NextResponse.json({
      profile: {
        ...profile,
        machines: profile.machines.map((m) => ({
          ...m,
          supportedColors: JSON.parse(m.supportedColors),
          supportedFilaments: JSON.parse(m.supportedFilaments),
          supportedNozzles: JSON.parse(m.supportedNozzles),
        })),
      },
    });
  } catch (error) {
    console.error('Get worker profile error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { isActive } = body;

    const updated = await prisma.workerProfile.update({
      where: { userId },
      data: {
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error('Update worker profile error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

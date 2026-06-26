import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, date, time, location, type, imageUrl, published } = body;

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(date && { date: new Date(date) }),
      ...(time && { time }),
      ...(location && { location }),
      ...(type && { type }),
      imageUrl: imageUrl !== undefined ? imageUrl : undefined,
      ...(published !== undefined && { published }),
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const events = await prisma.event.findMany({
    where: isAdmin ? undefined : { published: true },
    orderBy: { date: 'asc' },
  });
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, date, time, location, type, imageUrl, published } = body;

  if (!title || !description || !date || !time || !location || !type) {
    return NextResponse.json({ error: 'Campos requeridos incompletos' }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      date: new Date(date),
      time,
      location,
      type,
      imageUrl: imageUrl || null,
      published: published !== false,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

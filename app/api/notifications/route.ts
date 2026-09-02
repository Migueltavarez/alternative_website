import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.id;
  const { id } = await request.json().catch(() => ({}));

  if (id === 'all') {
    await prisma.notification.deleteMany({ where: { userId } });
  } else if (id) {
    await prisma.notification.deleteMany({ where: { id, userId } });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.id;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.id;
  const { id } = await request.json();

  if (id === 'all') {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  } else if (id) {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}

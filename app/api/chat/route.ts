import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMessagesForUser, sendMessage, markReadByUser, updateLastSeen } from '@/services/chat.service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const [messages, admin] = await Promise.all([
      getMessagesForUser(userId),
      prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { lastSeenAt: true } }),
      markReadByUser(userId),
      updateLastSeen(userId),
    ]);

    return NextResponse.json({
      messages,
      otherLastSeen: admin?.lastSeenAt ?? null,
    });
  } catch (error: any) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, imageUrl } = await request.json();
    const trimmedContent = String(content ?? '').trim();
    if (!trimmedContent && !imageUrl) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
    }

    const message = await sendMessage((session.user as any).id, 'USER', trimmedContent, imageUrl ?? undefined);
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Send chat message error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

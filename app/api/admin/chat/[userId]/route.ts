import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMessagesForUser, sendMessage, markReadByAdmin } from '@/services/chat.service';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await getMessagesForUser(params.userId);
    await markReadByAdmin(params.userId);

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Get admin chat thread error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, imageUrl } = await request.json();
    const trimmedContent = String(content ?? '').trim();
    if (!trimmedContent && !imageUrl) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
    }

    const message = await sendMessage(params.userId, 'ADMIN', trimmedContent, imageUrl ?? undefined);

    createNotification({
      userId: params.userId,
      type: 'message',
      title: 'Nuevo mensaje de soporte',
      body: trimmedContent || 'Te enviaron una imagen',
      link: '/dashboard?tab=soporte',
    }).catch(() => {});

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Send admin chat message error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

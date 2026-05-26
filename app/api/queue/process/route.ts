import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processQueue } from '@/lib/queue';

// Admin endpoint to manually trigger queue processing and stale job reassignment
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const assigned = await processQueue();

    return NextResponse.json({ success: true, assigned });
  } catch (error) {
    console.error('Queue process error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

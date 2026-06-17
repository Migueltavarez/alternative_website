import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET — list photos for a job
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const photos = await prisma.qualityPhoto.findMany({
    where: { printJobId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(photos);
}

// POST — add photo to a job
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { fileUrl, category, caption } = await request.json();
  if (!fileUrl || !category) return NextResponse.json({ error: 'fileUrl y category son requeridos' }, { status: 400 });

  const job = await prisma.printJob.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });

  const uploadedBy = (session.user as any).name || session.user.email || 'Admin';

  const photo = await prisma.qualityPhoto.create({
    data: { printJobId: params.id, fileUrl, category, caption: caption || null, uploadedBy },
  });

  return NextResponse.json(photo);
}

// DELETE — remove a photo
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { photoId } = await request.json();
  if (!photoId) return NextResponse.json({ error: 'photoId requerido' }, { status: 400 });

  await prisma.qualityPhoto.deleteMany({
    where: { id: photoId, printJobId: params.id },
  });

  return NextResponse.json({ ok: true });
}

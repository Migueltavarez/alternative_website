import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
  if (!course) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(course);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, price, isFree, isIntro, category, thumbnailUrl, published, lessons } = body;

  const course = await prisma.course.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      price: isFree ? 0 : (price ?? undefined),
      isFree: isFree !== undefined ? !!isFree : undefined,
      isIntro: isIntro !== undefined ? !!isIntro : undefined,
      category: category !== undefined ? category : undefined,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : undefined,
      ...(published !== undefined && { published }),
    },
  });

  if (lessons !== undefined) {
    await prisma.courseLesson.deleteMany({ where: { courseId: params.id } });
    if (lessons.length > 0) {
      await prisma.courseLesson.createMany({
        data: lessons.map((l: { title: string; videoUrl?: string; duration?: string; isFree?: boolean; order?: number }, i: number) => ({
          courseId: params.id,
          title: l.title,
          videoUrl: l.videoUrl || null,
          duration: l.duration || null,
          isFree: !!l.isFree,
          order: l.order ?? i,
        })),
      });
    }
  }

  const updated = await prisma.course.findUnique({
    where: { id: params.id },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

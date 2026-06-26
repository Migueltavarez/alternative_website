import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const courses = await prisma.course.findMany({
    where: isAdmin ? undefined : { published: true },
    include: {
      lessons: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(courses);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, price, isFree, isIntro, category, thumbnailUrl, published, lessons } = body;

  if (!title || !description) {
    return NextResponse.json({ error: 'Título y descripción son requeridos' }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      title,
      description,
      price: isFree ? 0 : (price || 0),
      isFree: !!isFree,
      isIntro: !!isIntro,
      category: category || null,
      thumbnailUrl: thumbnailUrl || null,
      published: published !== false,
      lessons: lessons?.length
        ? {
            create: lessons.map((l: { title: string; videoUrl?: string; duration?: string; isFree?: boolean; order?: number }, i: number) => ({
              title: l.title,
              videoUrl: l.videoUrl || null,
              duration: l.duration || null,
              isFree: !!l.isFree,
              order: l.order ?? i,
            })),
          }
        : undefined,
    },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });

  return NextResponse.json(course, { status: 201 });
}

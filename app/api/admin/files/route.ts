import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!existsSync(UPLOADS_DIR)) {
    return NextResponse.json({ files: [], totalSize: 0 });
  }

  const fileNames = await readdir(UPLOADS_DIR);

  // Gather all file URLs referenced in the DB
  const [printJobs, creditPurchases, subscriptions, qualityPhotos] = await Promise.all([
    prisma.printJob.findMany({
      select: {
        id: true, fileUrl: true, paymentProofUrl: true,
        fileName: true, status: true, priceStatus: true, serviceType: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.creditPurchase.findMany({
      select: { id: true, paymentProofUrl: true, user: { select: { name: true, email: true } } },
    }),
    prisma.subscription.findMany({
      select: { id: true, paymentProofUrl: true, user: { select: { name: true, email: true } } },
    }),
    prisma.qualityPhoto.findMany({
      select: { id: true, fileUrl: true, printJobId: true, category: true },
    }),
  ]);

  // Build a map: stored filename → reference info
  const refMap = new Map<string, { type: string; id: string; clientName: string; clientEmail: string; jobStatus?: string; jobPriceStatus?: string; serviceType?: string; originalName?: string }>();

  for (const job of printJobs) {
    if (job.fileUrl) {
      const name = path.basename(job.fileUrl);
      refMap.set(name, {
        type: 'modelo',
        id: job.id,
        clientName: job.user?.name ?? '',
        clientEmail: job.user?.email ?? '',
        jobStatus: job.status,
        jobPriceStatus: job.priceStatus ?? undefined,
        serviceType: job.serviceType ?? undefined,
        originalName: job.fileName,
      });
    }
    if (job.paymentProofUrl) {
      const name = path.basename(job.paymentProofUrl);
      refMap.set(name, {
        type: 'comprobante_trabajo',
        id: job.id,
        clientName: job.user?.name ?? '',
        clientEmail: job.user?.email ?? '',
        jobStatus: job.status,
      });
    }
  }

  for (const cp of creditPurchases) {
    if (cp.paymentProofUrl) {
      const name = path.basename(cp.paymentProofUrl);
      refMap.set(name, {
        type: 'comprobante_credito',
        id: cp.id,
        clientName: cp.user?.name ?? '',
        clientEmail: cp.user?.email ?? '',
      });
    }
  }

  for (const sub of subscriptions) {
    if (sub.paymentProofUrl) {
      const name = path.basename(sub.paymentProofUrl);
      refMap.set(name, {
        type: 'comprobante_suscripcion',
        id: sub.id,
        clientName: sub.user?.name ?? '',
        clientEmail: sub.user?.email ?? '',
      });
    }
  }

  for (const photo of qualityPhotos) {
    const name = path.basename(photo.fileUrl);
    refMap.set(name, {
      type: 'foto_qc',
      id: photo.id,
      clientName: 'Admin',
      clientEmail: '',
    });
  }

  // Build file list
  const files = await Promise.all(
    fileNames.map(async (name) => {
      const filePath = path.join(UPLOADS_DIR, name);
      const info = await stat(filePath);
      const ext = path.extname(name).toLowerCase();
      const ref = refMap.get(name) ?? null;
      return {
        name,
        size: info.size,
        ext,
        url: `/uploads/${name}`,
        createdAt: info.birthtime,
        referenced: ref !== null,
        refType: ref?.type ?? null,
        refId: ref?.id ?? null,
        clientName: ref?.clientName ?? null,
        clientEmail: ref?.clientEmail ?? null,
        jobStatus: ref?.jobStatus ?? null,
        jobPriceStatus: ref?.jobPriceStatus ?? null,
        serviceType: ref?.serviceType ?? null,
        originalName: ref?.originalName ?? null,
      };
    })
  );

  files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const orphanCount = files.filter((f) => !f.referenced).length;
  const orphanSize = files.filter((f) => !f.referenced).reduce((s, f) => s + f.size, 0);

  return NextResponse.json({ files, totalSize, orphanCount, orphanSize });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { fileNames } = await request.json() as { fileNames: string[] };

  if (!Array.isArray(fileNames) || fileNames.length === 0) {
    return NextResponse.json({ error: 'fileNames requerido' }, { status: 400 });
  }

  const deleted: string[] = [];
  const errors: string[] = [];

  for (const name of fileNames) {
    const safe = path.basename(name);
    const filePath = path.resolve(UPLOADS_DIR, safe);

    if (!filePath.startsWith(UPLOADS_DIR + path.sep) && filePath !== UPLOADS_DIR) {
      errors.push(safe);
      continue;
    }

    try {
      await unlink(filePath);
      deleted.push(safe);
    } catch {
      errors.push(safe);
    }
  }

  return NextResponse.json({ deleted, errors });
}

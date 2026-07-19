import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const dirExists = existsSync(UPLOADS_DIR);
    console.log('[admin/files] cwd:', process.cwd(), '| uploadsDir:', UPLOADS_DIR, '| exists:', dirExists);

    if (!dirExists) {
      return NextResponse.json({ files: [], totalSize: 0, orphanCount: 0, orphanSize: 0, _debug: { cwd: process.cwd(), uploadsDir: UPLOADS_DIR, dirExists: false } });
    }

    const entries = await readdir(UPLOADS_DIR, { withFileTypes: true });
    const fileEntries = entries.filter((e) => e.isFile());
    console.log('[admin/files] total entries:', entries.length, '| files:', fileEntries.length);

    // Gather all file URLs referenced in the DB
    const [printJobs, creditPurchases, subscriptions, qualityPhotos] = await Promise.all([
      prisma.printJob.findMany({
        select: {
          id: true, fileUrl: true, paymentProofUrl: true,
          fileName: true, status: true, serviceType: true,
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
        select: { id: true, fileUrl: true, printJobId: true },
      }),
    ]);

    // Build a map: stored filename → reference info
    type RefInfo = {
      type: string; id: string;
      clientName: string; clientEmail: string;
      jobStatus?: string; serviceType?: string; originalName?: string;
    };
    const refMap = new Map<string, RefInfo>();

    for (const job of printJobs) {
      if (job.fileUrl) {
        const name = path.basename(job.fileUrl);
        refMap.set(name, {
          type: 'modelo', id: job.id,
          clientName: job.user?.name ?? '', clientEmail: job.user?.email ?? '',
          jobStatus: job.status, serviceType: job.serviceType ?? undefined,
          originalName: job.fileName,
        });
      }
      if (job.paymentProofUrl) {
        const name = path.basename(job.paymentProofUrl);
        refMap.set(name, {
          type: 'comprobante_trabajo', id: job.id,
          clientName: job.user?.name ?? '', clientEmail: job.user?.email ?? '',
          jobStatus: job.status,
        });
      }
    }

    for (const cp of creditPurchases) {
      if (cp.paymentProofUrl) {
        refMap.set(path.basename(cp.paymentProofUrl), {
          type: 'comprobante_credito', id: cp.id,
          clientName: cp.user?.name ?? '', clientEmail: cp.user?.email ?? '',
        });
      }
    }

    for (const sub of subscriptions) {
      if (sub.paymentProofUrl) {
        refMap.set(path.basename(sub.paymentProofUrl), {
          type: 'comprobante_suscripcion', id: sub.id,
          clientName: sub.user?.name ?? '', clientEmail: sub.user?.email ?? '',
        });
      }
    }

    for (const photo of qualityPhotos) {
      refMap.set(path.basename(photo.fileUrl), {
        type: 'foto_qc', id: photo.id,
        clientName: 'Admin', clientEmail: '',
      });
    }

    // Build file list — skip any file that can't be stat'd
    const files: any[] = [];
    for (const entry of fileEntries) {
      try {
        const filePath = path.join(UPLOADS_DIR, entry.name);
        const info = await stat(filePath);
        const ref = refMap.get(entry.name) ?? null;
        files.push({
          name: entry.name,
          size: info.size,
          ext: path.extname(entry.name).toLowerCase(),
          url: `/uploads/${entry.name}`,
          createdAt: info.birthtime ?? info.mtime,
          referenced: ref !== null,
          refType: ref?.type ?? null,
          refId: ref?.id ?? null,
          clientName: ref?.clientName ?? null,
          clientEmail: ref?.clientEmail ?? null,
          jobStatus: ref?.jobStatus ?? null,
          serviceType: ref?.serviceType ?? null,
          originalName: ref?.originalName ?? null,
        });
      } catch {
        // skip unreadable files
      }
    }

    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalSize = files.reduce((s, f) => s + f.size, 0);
    const orphanCount = files.filter((f) => !f.referenced).length;
    const orphanSize = files.filter((f) => !f.referenced).reduce((s, f) => s + f.size, 0);

    return NextResponse.json({ files, totalSize, orphanCount, orphanSize, _debug: { cwd: process.cwd(), uploadsDir: UPLOADS_DIR, totalEntries: entries.length, fileEntries: fileEntries.length } });
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    console.error('[admin/files] GET error:', msg);
    return NextResponse.json({ error: `Error: ${msg}`, files: [], totalSize: 0, orphanCount: 0, orphanSize: 0 }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('[admin/files] DELETE error:', error);
    return NextResponse.json({ error: 'Error al eliminar archivos' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const CONTENT_TYPES: Record<string, string> = {
  '.stl': 'model/stl',
  '.obj': 'model/obj',
  '.3mf': 'application/x-3mf',
  '.gcode': 'text/x-gcode',
  '.step': 'application/step',
  '.stp': 'application/step',
  '.fbx': 'application/octet-stream',
  '.dae': 'model/vnd.collada+xml',
  '.blend': 'application/x-blender',
  '.amf': 'application/sla',
  '.g': 'text/x-gcode',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.dwg': 'application/acad',
  '.dxf': 'application/dxf',
};

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: { filePath: string[] } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use only the last segment and resolve against the uploads directory
    const rawName = params.filePath[params.filePath.length - 1];

    // Strip any directory traversal characters
    const safeName = path.basename(rawName);
    const fileFullPath = path.resolve(UPLOADS_DIR, safeName);

    // Ensure the resolved path stays within the uploads directory
    if (!fileFullPath.startsWith(UPLOADS_DIR + path.sep) && fileFullPath !== UPLOADS_DIR) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!existsSync(fileFullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const ext = path.extname(safeName).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    const fileBuffer = await readFile(fileFullPath);

    const inlineExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
    const disposition = inlineExts.has(ext) ? 'inline' : 'attachment';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `${disposition}; filename="${safeName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Error downloading file' }, { status: 500 });
  }
}

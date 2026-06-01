import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const contentTypes: Record<string, string> = {
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
};

export async function GET(
  request: NextRequest,
  { params }: { params: { filePath: string[] } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filePathParts = params.filePath;
    const fileName = filePathParts[filePathParts.length - 1];
    const fileFullPath = path.join(process.cwd(), 'public', 'uploads', fileName);

    if (!existsSync(fileFullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const ext = path.extname(fileName).toLowerCase();
    const contentType = contentTypes[ext] || 'application/octet-stream';

    const fileBuffer = await readFile(fileFullPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Error downloading file' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

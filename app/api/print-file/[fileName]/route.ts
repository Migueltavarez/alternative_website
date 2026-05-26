import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const fileTypes: Record<string, { contentType: string; disposition: string }> = {
  '.stl': { contentType: 'application/octet-stream', disposition: 'inline' },
  '.obj': { contentType: 'application/octet-stream', disposition: 'inline' },
  '.3mf': { contentType: 'application/3mf', disposition: 'inline' },
  '.gcode': { contentType: 'text/x-gcode', disposition: 'attachment' },
  '.step': { contentType: 'application/step', disposition: 'inline' },
  '.stp': { contentType: 'application/step', disposition: 'inline' },
  '.fbx': { contentType: 'application/octet-stream', disposition: 'inline' },
  '.dae': { contentType: 'model/vnd.collada+xml', disposition: 'inline' },
  '.blend': { contentType: 'application/x-blender', disposition: 'attachment' },
  '.amf': { contentType: 'application/sla', disposition: 'inline' },
  '.g': { contentType: 'text/x-gcode', disposition: 'attachment' },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const fileName = params.fileName;
    
    if (!fileName || fileName.includes('..') || fileName.includes('/')) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }

    const fileFullPath = path.join(process.cwd(), 'public', 'uploads', fileName);

    if (!existsSync(fileFullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const ext = path.extname(fileName).toLowerCase();
    const fileConfig = fileTypes[ext] || { contentType: 'application/octet-stream', disposition: 'inline' };

    const fileBuffer = await readFile(fileFullPath);

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': fileConfig.contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `${fileConfig.disposition}; filename="${fileName}"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Public download error:', error);
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

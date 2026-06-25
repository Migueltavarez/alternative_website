import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const ALLOWED_EXTENSIONS = new Set([
  '.stl', '.obj', '.3mf', '.gcode', '.step', '.stp',
  '.fbx', '.dae', '.blend', '.max', '.3ds',
  '.pdf', '.dwg', '.dxf',
  '.jpg', '.jpeg', '.png', '.webp',
]);

// Magic bytes for file type validation
const MAGIC_BYTES: Array<{ ext: string; magic: number[] }> = [
  { ext: '.jpg',  magic: [0xFF, 0xD8, 0xFF] },
  { ext: '.jpeg', magic: [0xFF, 0xD8, 0xFF] },
  { ext: '.png',  magic: [0x89, 0x50, 0x4E, 0x47] },
  { ext: '.webp', magic: [0x52, 0x49, 0x46, 0x46] },
  { ext: '.pdf',  magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  const signature = MAGIC_BYTES.find((m) => m.ext === ext);
  if (!signature) return true; // no magic check for 3D files
  return signature.magic.every((byte, i) => buffer[i] === byte);
}

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit uploads: 20 per hour per user
    const userId = (session.user as any).id;
    const rl = rateLimit(`upload:${userId}`, 20, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Límite de subidas alcanzado. Intenta en ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExt = path.extname(file.name).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${fileExt}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo supera el límite de 100 MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file content matches declared extension
    if (!validateMagicBytes(buffer, fileExt)) {
      return NextResponse.json(
        { error: 'El contenido del archivo no coincide con su extensión' },
        { status: 400 }
      );
    }

    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const safeFileName = `${uniqueSuffix}${fileExt}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      fileName: file.name,
      fileUrl: `/uploads/${safeFileName}`,
      fileSize: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}

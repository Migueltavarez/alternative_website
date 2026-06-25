import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

function parseBinaryStl(buffer: Buffer) {
  if (buffer.length < 84) return null;

  const numTriangles = buffer.readUInt32LE(80);
  const expectedSize = 84 + numTriangles * 50;
  if (buffer.length !== expectedSize) return null; // not valid binary STL

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let volume = 0;
  let offset = 84;

  for (let i = 0; i < numTriangles; i++) {
    offset += 12; // skip normal

    const v1x = buffer.readFloatLE(offset),     v1y = buffer.readFloatLE(offset + 4),     v1z = buffer.readFloatLE(offset + 8);     offset += 12;
    const v2x = buffer.readFloatLE(offset),     v2y = buffer.readFloatLE(offset + 4),     v2z = buffer.readFloatLE(offset + 8);     offset += 12;
    const v3x = buffer.readFloatLE(offset),     v3y = buffer.readFloatLE(offset + 4),     v3z = buffer.readFloatLE(offset + 8);     offset += 12;
    offset += 2;

    minX = Math.min(minX, v1x, v2x, v3x); maxX = Math.max(maxX, v1x, v2x, v3x);
    minY = Math.min(minY, v1y, v2y, v3y); maxY = Math.max(maxY, v1y, v2y, v3y);
    minZ = Math.min(minZ, v1z, v2z, v3z); maxZ = Math.max(maxZ, v1z, v2z, v3z);

    // Signed volume of tetrahedron from origin
    volume += (v1x * (v2y * v3z - v3y * v2z) + v2x * (v3y * v1z - v1y * v3z) + v3x * (v1y * v2z - v2y * v1z)) / 6;
  }

  return {
    dimensions: {
      x: Math.round(Math.abs(maxX - minX) * 10) / 10,
      y: Math.round(Math.abs(maxY - minY) * 10) / 10,
      z: Math.round(Math.abs(maxZ - minZ) * 10) / 10,
    },
    volume: Math.abs(volume),
    precise: true,
  };
}

function parseAsciiStl(text: string) {
  const vertexRegex = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
  let match;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let found = false;

  while ((match = vertexRegex.exec(text)) !== null) {
    const x = parseFloat(match[1]), y = parseFloat(match[2]), z = parseFloat(match[3]);
    if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    found = true;
  }

  if (!found) return null;

  const dx = Math.abs(maxX - minX);
  const dy = Math.abs(maxY - minY);
  const dz = Math.abs(maxZ - minZ);

  return {
    dimensions: {
      x: Math.round(dx * 10) / 10,
      y: Math.round(dy * 10) / 10,
      z: Math.round(dz * 10) / 10,
    },
    volume: dx * dy * dz * 0.3, // approximate: bounding box × ~30% fill factor
    precise: false,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileUrl } = await request.json();
    if (!fileUrl || typeof fileUrl !== 'string') {
      return NextResponse.json({ error: 'fileUrl requerido' }, { status: 400 });
    }

    const ext = path.extname(fileUrl).toLowerCase();
    if (ext !== '.stl') {
      return NextResponse.json({ error: 'Solo archivos STL' }, { status: 400 });
    }

    const safeName = path.basename(fileUrl);
    const filePath = path.resolve(UPLOADS_DIR, safeName);

    if (!filePath.startsWith(UPLOADS_DIR + path.sep)) {
      return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    const buffer = await readFile(filePath);

    // Detect binary vs ASCII STL
    const result = parseBinaryStl(buffer) ?? parseAsciiStl(buffer.toString('utf-8'));

    if (!result) {
      return NextResponse.json({ error: 'No se pudo analizar el archivo' }, { status: 422 });
    }

    // Estimate weight: PLA density 1.24 g/cm³, 20% infill → effective 0.248 g/cm³
    // volume is in mm³, convert to cm³ (÷1000), multiply by density and infill
    const PLA_INFILL_DENSITY = 1.24 * 0.20; // g/cm³
    const volumeCm3 = result.volume / 1000;
    const estimatedWeightG = Math.max(1, Math.round(volumeCm3 * PLA_INFILL_DENSITY));

    // Rough credit estimate: assume ~RD$3 per gram production cost, so ~0.2 credits/gram
    // But since credits = RD$15 each, 1g ≈ 0.2 credits.
    // Let's use a broader range to account for variability.
    const creditsMin = Math.max(5, Math.round(estimatedWeightG * 0.15));
    const creditsMax = Math.round(estimatedWeightG * 0.5);

    return NextResponse.json({
      dimensions: result.dimensions,
      estimatedWeightG,
      creditsMin,
      creditsMax,
      precise: result.precise,
    });
  } catch (error) {
    console.error('STL analysis error:', error);
    return NextResponse.json({ error: 'Error al analizar el archivo' }, { status: 500 });
  }
}

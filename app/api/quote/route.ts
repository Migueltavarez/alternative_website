import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSTL } from '@/lib/stl-parser';
import { calculateQuote, parsePricingConfig, DEFAULT_PRICING_CONFIG } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const material = formData.get('material') as string | null;
    const infillRaw = formData.get('infill') as string | null;
    const quality = formData.get('quality') as string | null;

    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    if (!material) return NextResponse.json({ error: 'Material requerido' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'stl') {
      return NextResponse.json({ error: 'Solo se aceptan archivos STL por ahora' }, { status: 400 });
    }

    const MAX_MB = 100;
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `El archivo no puede superar ${MAX_MB} MB` }, { status: 400 });
    }

    const infill = Math.min(100, Math.max(10, parseInt(infillRaw ?? '20', 10)));
    const qualityLevel = (['draft', 'standard', 'fine'].includes(quality ?? '') ? quality : 'standard') as 'draft' | 'standard' | 'fine';

    // Parse STL
    const buffer = await file.arrayBuffer();
    const stl = parseSTL(buffer);

    if (stl.volumeCm3 <= 0 || stl.triangleCount === 0) {
      return NextResponse.json({ error: 'El archivo STL no tiene geometría válida' }, { status: 422 });
    }

    // Load pricing config (falls back to defaults if no DB record yet)
    let config = DEFAULT_PRICING_CONFIG;
    try {
      const dbConfig = await prisma.pricingConfig.findUnique({ where: { id: 1 } });
      if (dbConfig) config = parsePricingConfig(dbConfig);
    } catch {
      // DB not migrated yet or no config row — use defaults
    }

    const quote = calculateQuote(
      { volumeCm3: stl.volumeCm3, bboxZ: stl.bbox.z, material, infill, quality: qualityLevel },
      config,
    );

    return NextResponse.json({
      ok: true,
      stl: {
        volumeCm3: stl.volumeCm3,
        bbox: stl.bbox,
        triangleCount: stl.triangleCount,
      },
      quote,
      inputs: { material, infill, quality: qualityLevel },
    });
  } catch (err) {
    console.error('Quote error:', err);
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 });
  }
}

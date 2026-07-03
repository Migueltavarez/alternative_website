import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parsePricingConfig, DEFAULT_PRICING_CONFIG } from '@/lib/pricing';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } });
  return user?.role === 'ADMIN' ? session : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let raw = await prisma.pricingConfig.findUnique({ where: { id: 1 } });
  if (!raw) {
    const d = DEFAULT_PRICING_CONFIG;
    raw = await prisma.pricingConfig.create({
      data: {
        id: 1,
        materialDensity: JSON.stringify(d.materialDensity),
        materialPricePerGram: JSON.stringify(d.materialPricePerGram),
        materialMarginPercent: JSON.stringify(d.materialMarginPercent),
        materialRollCost: JSON.stringify(d.materialRollCost),
        materialRollWeightG: JSON.stringify(d.materialRollWeightG),
        machineRatePerHour: d.machineRatePerHour,
        platformMargin: d.platformMargin,
        makerSplit: d.makerSplit,
        extrusionRateByQuality: JSON.stringify(d.extrusionRateByQuality),
        planSheetPrices: JSON.stringify(d.planSheetPrices),
      },
    });
  }

  return NextResponse.json(parsePricingConfig(raw));
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    materialDensity,
    materialMarginPercent,
    materialRollCost,
    materialRollWeightG,
    machineRatePerHour,
    platformMargin,
    makerSplit,
    extrusionRateByQuality,
    planSheetPrices,
  } = body;

  if (
    !materialDensity || !materialRollCost || !materialRollWeightG || !extrusionRateByQuality ||
    typeof machineRatePerHour !== 'number' ||
    typeof platformMargin !== 'number' ||
    typeof makerSplit !== 'number'
  ) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  if (platformMargin + makerSplit > 1.5) {
    return NextResponse.json({ error: 'La suma de margen y split de maker parece incorrecta' }, { status: 400 });
  }

  // Derive materialPricePerGram from roll data
  const materialPricePerGram: Record<string, number> = Object.fromEntries(
    Object.keys(materialRollCost).map((mat: string) => {
      const cost = (materialRollCost as Record<string, number>)[mat] ?? 0;
      const weight = (materialRollWeightG as Record<string, number>)[mat] ?? 1000;
      return [mat, weight > 0 ? cost / weight : 0];
    })
  );

  const updated = await prisma.pricingConfig.upsert({
    where: { id: 1 },
    update: {
      materialDensity: JSON.stringify(materialDensity),
      materialPricePerGram: JSON.stringify(materialPricePerGram),
      materialMarginPercent: JSON.stringify(materialMarginPercent ?? {}),
      materialRollCost: JSON.stringify(materialRollCost),
      materialRollWeightG: JSON.stringify(materialRollWeightG),
      machineRatePerHour,
      platformMargin,
      makerSplit,
      extrusionRateByQuality: JSON.stringify(extrusionRateByQuality),
      planSheetPrices: JSON.stringify(planSheetPrices ?? {}),
    },
    create: {
      id: 1,
      materialDensity: JSON.stringify(materialDensity),
      materialPricePerGram: JSON.stringify(materialPricePerGram),
      materialMarginPercent: JSON.stringify(materialMarginPercent ?? {}),
      materialRollCost: JSON.stringify(materialRollCost),
      materialRollWeightG: JSON.stringify(materialRollWeightG),
      machineRatePerHour,
      platformMargin,
      makerSplit,
      extrusionRateByQuality: JSON.stringify(extrusionRateByQuality),
      planSheetPrices: JSON.stringify(planSheetPrices ?? {}),
    },
  });

  return NextResponse.json(parsePricingConfig(updated));
}

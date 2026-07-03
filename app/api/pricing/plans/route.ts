import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_SHEET_PRICES = { '24x36': 0, '24x18': 0, '11x17': 0, '8.5x11': 0 };

export async function GET() {
  const raw = await prisma.pricingConfig.findUnique({ where: { id: 1 } });
  const planSheetPrices = raw?.planSheetPrices
    ? JSON.parse(raw.planSheetPrices)
    : DEFAULT_SHEET_PRICES;
  return NextResponse.json({ planSheetPrices });
}

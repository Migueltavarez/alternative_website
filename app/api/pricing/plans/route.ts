import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_SHEET_PRICES = {
  '24x36_color': 0, '24x36_bw': 0,
  '24x18_color': 0, '24x18_bw': 0,
  '11x17_color': 0, '11x17_bw': 0,
  '8.5x11_color': 0, '8.5x11_bw': 0,
  'pancarta_color': 0, 'pancarta_bw': 0,
};

export async function GET() {
  const raw = await prisma.pricingConfig.findUnique({ where: { id: 1 } });
  const planSheetPrices = raw?.planSheetPrices
    ? JSON.parse(raw.planSheetPrices)
    : DEFAULT_SHEET_PRICES;
  return NextResponse.json({ planSheetPrices });
}

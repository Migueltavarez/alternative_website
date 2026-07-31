import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_CREDIT_PACKAGES } from '@/lib/pricing';

export async function GET() {
  try {
    const config = await prisma.pricingConfig.findUnique({ where: { id: 1 } });
    const packages = config?.creditPackages ? JSON.parse(config.creditPackages) : DEFAULT_CREDIT_PACKAGES;
    return NextResponse.json(packages);
  } catch {
    return NextResponse.json(DEFAULT_CREDIT_PACKAGES);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DEFAULT_CREDIT_PACKAGES } from '@/lib/pricing';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { packageId, useDiscount } = body;

    const config = await prisma.pricingConfig.findUnique({ where: { id: 1 } });
    const packages = config?.creditPackages ? JSON.parse(config.creditPackages) : DEFAULT_CREDIT_PACKAGES;
    const creditPackage = packages.find((p: any) => p.id === packageId);

    if (!creditPackage) {
      return NextResponse.json({ error: 'Paquete inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let finalPriceDOP: number = Number(creditPackage.priceDOP);
    let discountApplied = 0;

    if (useDiscount && user.discountBalance > 0) {
      discountApplied = Math.min(finalPriceDOP * 0.10, user.discountBalance);
      finalPriceDOP = finalPriceDOP - discountApplied;
    }

    if (discountApplied > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { discountBalance: { decrement: discountApplied } },
      });
    }

    const creditPurchase = await prisma.creditPurchase.create({
      data: {
        userId,
        credits: creditPackage.credits,
        amount: finalPriceDOP,
        status: 'pending',
      },
    });

    return NextResponse.json({
      purchaseId: creditPurchase.id,
      packageName: creditPackage.name,
      credits: creditPackage.credits,
      priceDOP: finalPriceDOP,
      amount: finalPriceDOP,
    });
  } catch (error: any) {
    console.error('Credit checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

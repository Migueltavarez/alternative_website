import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CREDIT_PACKAGES } from '@/lib/credits';
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

    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);

    if (!creditPackage) {
      return NextResponse.json({ error: 'Paquete inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let finalPrice: number = Number(creditPackage.price);
    let discountApplied = 0;

    if (useDiscount && user.discountBalance > 0) {
      discountApplied = Math.min(creditPackage.price * 0.10, user.discountBalance);
      finalPrice = Number(creditPackage.price) - discountApplied;
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
        amount: finalPrice,
        status: 'pending',
      },
    });

    return NextResponse.json({
      purchaseId: creditPurchase.id,
      packageName: creditPackage.name,
      credits: creditPackage.credits,
      priceDOP: creditPackage.priceDOP,
      amount: finalPrice,
    });
  } catch (error: any) {
    console.error('Credit checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

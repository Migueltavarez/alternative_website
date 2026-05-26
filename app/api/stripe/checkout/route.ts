import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkoutSchema } from '@/lib/validations';
import { PLANS, createOrder } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { planId } = checkoutSchema.parse(body);

    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const order = await createOrder(planId, userId, user.referralCode);

    const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'No se pudo crear la orden de PayPal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: approvalUrl, orderId: order.id });
  } catch (error: any) {
    console.error('Checkout error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validación fallida' },
        { status: 400 }
      );
    }

    if (error.message?.includes('PayPal')) {
      return NextResponse.json(
        { error: 'Error de PayPal. Verifica la configuración.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

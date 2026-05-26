import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CREDIT_PACKAGES } from '@/lib/credits';
import { prisma } from '@/lib/prisma';

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let finalPrice: number = Number(creditPackage.price);
    let discountApplied = 0;

    if (useDiscount && user.discountBalance > 0) {
      discountApplied = Math.min(creditPackage.price * 0.10, user.discountBalance);
      finalPrice = Number(creditPackage.price) - discountApplied;
    }

    if (finalPrice <= 0) {
      finalPrice = 0.01;
    }

    const creditPurchase = await prisma.creditPurchase.create({
      data: {
        userId,
        credits: creditPackage.credits,
        amount: finalPrice,
        status: 'pending',
      },
    });

    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: finalPrice.toFixed(2),
            },
            description: `${creditPackage.name} - Alternative 3D Studio`,
            custom_id: JSON.stringify({ 
              userId, 
              packageId,
              purchaseId: creditPurchase.id,
              type: 'credits',
              originalPrice: creditPackage.price,
              discountApplied,
            }),
          },
        ],
        application_context: {
          brand_name: 'Alternative 3D Studio',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/credits/capture`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal error: ${JSON.stringify(error)}`);
    }

    const order = await response.json();
    const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'No se pudo crear la orden de PayPal' },
        { status: 500 }
      );
    }

    if (discountApplied > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          discountBalance: {
            decrement: discountApplied,
          },
        },
      });
    }

    return NextResponse.json({ url: approvalUrl, orderId: order.id });
  } catch (error: any) {
    console.error('Credit purchase error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

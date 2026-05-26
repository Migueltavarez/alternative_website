import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CREDIT_PACKAGES } from '@/lib/credits';

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

async function getOrderDetails(orderId: string) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.json();
}

async function captureOrder(orderId: string) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const canceled = searchParams.get('canceled');

  if (canceled === 'true') {
    return NextResponse.redirect(new URL('/dashboard?canceled=true', request.url));
  }

  if (!token) {
    return NextResponse.redirect(new URL('/dashboard?error=no_order', request.url));
  }

  try {
    const order = await getOrderDetails(token);

    if (order.status !== 'COMPLETED') {
      const captured = await captureOrder(token);
      if (captured.status !== 'COMPLETED') {
        return NextResponse.redirect(new URL('/dashboard?error=not_completed', request.url));
      }
    }

    const customId = JSON.parse(order.purchase_units[0].custom_id || '{}');
    const { userId, packageId, purchaseId, type } = customId;

    if (type !== 'credits' || !purchaseId) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid_order', request.url));
    }

    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!creditPackage) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid_package', request.url));
    }

    await prisma.creditPurchase.update({
      where: { id: purchaseId },
      data: {
        status: 'completed',
        paymentId: token,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: creditPackage.credits,
        },
      },
    });

    return NextResponse.redirect(new URL('/dashboard?credits_success=true', request.url));
  } catch (error) {
    console.error('Credit capture error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=capture_failed', request.url));
  }
}

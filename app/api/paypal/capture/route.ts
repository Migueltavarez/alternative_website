import { NextRequest, NextResponse } from 'next/server';
import { captureOrder, getOrderDetails } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/paypal';

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
    const { userId, planId } = customId;

    if (!userId || !planId) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid_order', request.url));
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid_plan', request.url));
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId },
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan: planId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paypalOrderId: token,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          plan: planId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paypalOrderId: token,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.referredBy) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: user.referredBy.toUpperCase() },
      });

      if (referrer) {
        const reward = plan.price * 0.10;

        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: userId,
            reward,
            used: true,
          },
        });

        await prisma.user.update({
          where: { id: referrer.id },
          data: {
            discountBalance: {
              increment: reward,
            },
          },
        });
      }
    }

    return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=capture_failed', request.url));
  }
}

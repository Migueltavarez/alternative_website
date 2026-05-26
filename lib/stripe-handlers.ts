import Stripe from 'stripe';
import { prisma } from './prisma';
import { PLANS, PlanType } from './stripe';

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const referralCode = session.metadata?.referralCode;

  if (!userId) {
    console.error('No userId in checkout session');
    return;
  }

  if (session.customer && typeof session.customer === 'string') {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: session.customer },
    });
  }

  if (referralCode) {
    await processReferral(userId, referralCode);
  }
}

export async function handleCustomerSubscriptionCreated(
  subscription: Stripe.Subscription,
  customerId: string
) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });
    
    if (!user) {
      console.error('No user found for customer:', customerId);
      return;
    }
    
    await createOrUpdateSubscription(user.id, subscription);
  } else {
    await createOrUpdateSubscription(userId, subscription);
  }
}

export async function handleCustomerSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('No userId in subscription update');
    return;
  }

  await createOrUpdateSubscription(userId, subscription);
}

export async function handleCustomerSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  await prisma.subscription.deleteMany({
    where: { stripeSubscriptionId: subscription.id },
  });
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription },
      include: { user: true },
    });

    if (dbSubscription?.user.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: dbSubscription.user.referredBy },
      });

      if (referrer) {
        const plan = Object.values(PLANS).find(
          (p) => p.priceId === dbSubscription.stripePriceId
        );
        const reward = plan ? plan.price * 0.1 : 0;

        await prisma.user.update({
          where: { id: referrer.id },
          data: {
            discountBalance: {
              increment: reward,
            },
          },
        });

        await prisma.referral.updateMany({
          where: {
            referredUserId: dbSubscription.userId,
            referrerId: referrer.id,
            used: false,
          },
          data: {
            used: true,
            reward: reward,
          },
        });
      }
    }
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription },
      data: { status: 'past_due' },
    });
  }
}

async function createOrUpdateSubscription(userId: string, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const plan = Object.entries(PLANS).find(([_, p]) => p.priceId === priceId)?.[0] || 'BASIC';

  const subscriptionData = {
    userId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    plan: plan,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  await prisma.subscription.upsert({
    where: { userId },
    update: subscriptionData,
    create: subscriptionData,
  });
}

async function processReferral(referredUserId: string, referralCode: string) {
  const referrer = await prisma.user.findUnique({
    where: { referralCode },
  });

  if (referrer && referrer.id !== referredUserId) {
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId,
      },
    });

    await prisma.user.update({
      where: { id: referredUserId },
      data: { referredBy: referralCode },
    });
  }
}

export function verifyWebhookSignature(payload: string | Buffer, signature: string) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!);
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

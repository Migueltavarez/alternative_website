import prisma from '@/lib/prisma';

export async function getAllSubscriptions() {
  const existingUserIds = await prisma.user.findMany({ select: { id: true } }).then(u => u.map(u => u.id));
  return prisma.subscription.findMany({
    where: { userId: { in: existingUserIds } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          referralCode: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSubscriptionByUserId(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  });
}

export async function cancelSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error('Suscripción no encontrada');
  }

  if (subscription.stripeSubscriptionId) {
    try {
      const { stripe } = await import('@/lib/stripe');
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error);
      throw error;
    }
  }

  return prisma.subscription.update({
    where: { userId },
    data: { 
      status: 'canceled',
      cancelAtPeriodEnd: true 
    },
  });
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string
) {
  return prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: { status: status as any },
  });
}

export async function getRevenueStats() {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'active' },
    include: { user: true },
  });

  const byPlan = subscriptions.reduce(
    (acc, sub) => {
      const plan = sub.plan;
      if (!acc[plan]) acc[plan] = 0;
      acc[plan]++;
      return acc;
    },
    {} as Record<string, number>
  );

  const prices: Record<string, number> = {
    BASIC: 33.4,
    PRO: 83.51,
    PREMIUM: 133.61,
  };

  const mrr = Object.entries(byPlan).reduce((total, [plan, count]) => {
    return total + (prices[plan] || 0) * count;
  }, 0);

  return { byPlan, mrr, totalActive: subscriptions.length };
}

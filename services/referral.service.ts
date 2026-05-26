import prisma from '@/lib/prisma';
import { PLANS } from '@/lib/stripe';

export async function createReferral(referrerId: string, referredUserId: string) {
  const existing = await prisma.referral.findUnique({
    where: {
      referrerId_referredUserId: {
        referrerId,
        referredUserId,
      },
    },
  });

  if (existing) {
    throw new Error('Referral already exists');
  }

  return prisma.referral.create({
    data: {
      referrerId,
      referredUserId,
    },
  });
}

export async function creditReferralReward(referrerId: string, plan: string) {
  const planKey = plan as keyof typeof PLANS;
  const planData = PLANS[planKey];
  
  if (!planData) {
    throw new Error('Invalid plan');
  }

  const reward = planData.price * 0.1;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: referrerId },
      data: {
        discountBalance: {
          increment: reward,
        },
      },
    });

    await tx.referral.updateMany({
      where: {
        referrerId,
        used: false,
      },
      data: {
        used: true,
        reward,
      },
    });
  });

  return { success: true, reward };
}

export async function getReferralsByUserId(userId: string) {
  return prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referredUser: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getReferralStats() {
  const [totalReferrals, successfulReferrals, totalRewards] = await Promise.all([
    prisma.referral.count(),
    prisma.referral.count({ where: { used: true } }),
    prisma.referral.aggregate({
      _sum: { reward: true },
      where: { used: true },
    }),
  ]);

  return {
    totalReferrals,
    successfulReferrals,
    totalRewards: totalRewards._sum.reward || 0,
  };
}

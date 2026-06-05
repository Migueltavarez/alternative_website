import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateReferralCode } from '@/lib/utils';

interface RegisterUserInput {
  email: string;
  password: string;
  name?: string;
  referralCode?: string;
}

export async function registerUser(input: RegisterUserInput) {
  const { email, password, name, referralCode } = input;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  let validReferralCode = referralCode?.toUpperCase();
  
  if (referralCode) {
    const referrer = await prisma.user.findFirst({
      where: { referralCode: validReferralCode },
    });
    
    if (!referrer) {
      validReferralCode = undefined;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  let newReferralCode = generateReferralCode();

  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.user.findUnique({
      where: { referralCode: newReferralCode },
    });
    
    if (!existing) break;
    newReferralCode = generateReferralCode();
    attempts++;
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      referralCode: newReferralCode.toUpperCase(),
      referredBy: validReferralCode?.toUpperCase(),
    },
  });

  return user;
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      subscription: true,
      referralsGiven: {
        include: {
          referredUser: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
        },
      },
    },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      subscription: true,
      _count: {
        select: {
          referralsGiven: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateUserRole(userId: string, role: 'USER' | 'WORKER' | 'ADMIN') {
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { role },
    }),
    ...(role === 'USER'
      ? [prisma.workerProfile.updateMany({
          where: { userId },
          data: { isActive: false },
        })]
      : []),
  ]);

  return user;
}

export async function applyDiscountBalance(userId: string, amount: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error('User not found');
  if (user.discountBalance < amount) throw new Error('Insufficient balance');

  return prisma.user.update({
    where: { id: userId },
    data: {
      discountBalance: {
        decrement: amount,
      },
    },
  });
}

export async function getDashboardStats() {
  const [users, subscriptions, referrals, recentContacts] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({
      where: { status: 'active' },
    }),
    prisma.referral.count(),
    prisma.contact.count({
      where: { read: false },
    }),
  ]);

  return { users, subscriptions, referrals, recentContacts };
}

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateReferralCode } from '@/lib/utils';
import { sendVerificationEmail } from '@/lib/email';

const STUDENT_DOMAINS = ['unphu.edu.do', 'unapec.edu.do', 'ce.pucmm.edu.do'];

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

  const domain = email.toLowerCase().split('@')[1];
  const isStudent = STUDENT_DOMAINS.includes(domain);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      referralCode: newReferralCode.toUpperCase(),
      referredBy: validReferralCode?.toUpperCase(),
      isStudent,
      verificationToken,
      verificationTokenExpiry,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alt3dstudio.com';
  const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

  sendVerificationEmail(user.email, verifyUrl, user.name).catch(err =>
    console.error('Verification email error:', err)
  );

  return user;
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      credits: true,
      discountBalance: true,
      referralCode: true,
      isStudent: true,
      emailVerified: true,
      phone: true,
      cedula: true,
      birthDate: true,
      createdAt: true,
      subscription: true,
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
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

export async function updateUserProfile(
  userId: string,
  data: { phone?: string; cedula?: string; birthDate?: Date }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      credits: true,
      discountBalance: true,
      referralCode: true,
      referredBy: true,
      stripeCustomerId: true,
      isStudent: true,
      emailVerified: true,
      createdAt: true,
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

export async function updateUserRole(userId: string, role: 'USER' | 'WORKER' | 'DESIGNER' | 'ADMIN') {
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

  // Designers have no equipment to register themselves, so provision an
  // empty WorkerProfile right away so they show up for admins and can
  // access their panel immediately.
  if (role === 'DESIGNER') {
    await prisma.workerProfile.upsert({
      where: { userId },
      update: { isActive: true },
      create: { userId },
    });
  }

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

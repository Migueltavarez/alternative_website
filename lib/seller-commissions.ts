import prisma from '@/lib/prisma';

const FIRST_SERVICE_RATE = 0.10;
const RECURRING_RATE = 0.03;
const BONUS_AMOUNT = 1000;       // RD$
const BONUS_EVERY_N_USERS = 5;

export async function processSellerCommission(printJobId: string): Promise<void> {
  try {
    const job = await prisma.printJob.findUnique({
      where: { id: printJobId },
      select: { id: true, userId: true, price: true },
    });

    if (!job || !job.price || job.price <= 0) return;

    const client = await prisma.user.findUnique({
      where: { id: job.userId },
      select: { id: true, referredBySellerId: true },
    });

    if (!client?.referredBySellerId) return;

    const sellerId = client.referredBySellerId;

    // Count confirmed-payment jobs by this client BEFORE this one
    const previousPaidJobs = await prisma.printJob.count({
      where: {
        userId: client.id,
        priceStatus: 'confirmed',
        id: { not: printJobId },
      },
    });

    const isFirstService = previousPaidJobs === 0;
    const rate = isFirstService ? FIRST_SERVICE_RATE : RECURRING_RATE;
    const amount = Math.round(job.price * rate * 100) / 100;
    const type = isFirstService ? 'first_service' : 'recurring';

    await prisma.sellerCommission.create({
      data: {
        sellerId,
        clientId: client.id,
        printJobId: job.id,
        type,
        rate,
        jobPrice: job.price,
        amount,
        status: 'pending',
      },
    });

    // Bonus check: every BONUS_EVERY_N_USERS new referred users who completed first service
    if (isFirstService) {
      const totalFirstServices = await prisma.sellerCommission.count({
        where: { sellerId, type: 'first_service' },
      });

      // After insertion, if total is a multiple of BONUS_EVERY_N_USERS, award bonus
      if (totalFirstServices % BONUS_EVERY_N_USERS === 0) {
        await prisma.sellerCommission.create({
          data: {
            sellerId,
            clientId: null,
            printJobId: null,
            type: 'bonus',
            rate: 0,
            jobPrice: 0,
            amount: BONUS_AMOUNT,
            status: 'pending',
          },
        });
      }
    }
  } catch (err) {
    console.error('processSellerCommission error:', err);
  }
}

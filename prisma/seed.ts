import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@alternative3d.com';
  const adminPassword = 'Admin123!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        referralCode: 'ADMIN001',
      },
    });

    console.log(`Admin user created:`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  (Change this password after first login!)`);
  } else {
    console.log('Admin user already exists');
  }

  // PricingConfig singleton (upsert so re-runs don't fail)
  await prisma.pricingConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      materialDensity: JSON.stringify({
        'PLA': 1.24, 'PLA+': 1.24, 'SILK PLA': 1.24, 'ABS': 1.05,
        'PETG': 1.27, 'TPU (Flexible)': 1.21, 'ASA': 1.07, 'Nylon': 1.14,
        'Resina (SLA)': 1.18, 'WOOD PLA': 1.15,
      }),
      materialPricePerGram: JSON.stringify({
        'PLA': 0.40, 'PLA+': 0.45, 'SILK PLA': 0.55, 'ABS': 0.48,
        'PETG': 0.50, 'TPU (Flexible)': 0.65, 'ASA': 0.55, 'Nylon': 0.70,
        'Resina (SLA)': 0.90, 'WOOD PLA': 0.45,
      }),
      materialMarginPercent: JSON.stringify({
        'PLA': 30, 'PLA+': 30, 'SILK PLA': 35, 'ABS': 30,
        'PETG': 30, 'TPU (Flexible)': 35, 'ASA': 35, 'Nylon': 35,
        'Resina (SLA)': 40, 'WOOD PLA': 30,
      }),
      machineRatePerHour: 100,
      platformMargin: 0.30,
      makerSplit: 0.70,
      extrusionRateByQuality: JSON.stringify({ draft: 25, standard: 15, fine: 8 }),
    },
  });
  console.log('PricingConfig seeded');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

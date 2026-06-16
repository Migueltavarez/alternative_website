import { prisma } from '@/lib/prisma';

const MAX_ADDRESSES = 3;

interface AddressInput {
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  sector: string;
  city: string;
  province: string;
  notes?: string;
  isDefault?: boolean;
}

export async function getAddressesByUserId(userId: string) {
  return prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function createAddress(userId: string, data: AddressInput) {
  const count = await prisma.userAddress.count({ where: { userId } });
  if (count >= MAX_ADDRESSES) {
    throw new Error('Ya tienes el máximo de 3 direcciones registradas');
  }

  const makeDefault = data.isDefault || count === 0;
  if (makeDefault) {
    await prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  return prisma.userAddress.create({
    data: { ...data, userId, isDefault: makeDefault },
  });
}

export async function updateAddress(userId: string, addressId: string, data: Partial<AddressInput>) {
  const address = await prisma.userAddress.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new Error('Dirección no encontrada');
  }

  if (data.isDefault) {
    await prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  return prisma.userAddress.update({ where: { id: addressId }, data });
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await prisma.userAddress.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new Error('Dirección no encontrada');
  }

  await prisma.userAddress.delete({ where: { id: addressId } });

  if (address.isDefault) {
    const next = await prisma.userAddress.findFirst({ where: { userId } });
    if (next) {
      await prisma.userAddress.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
}

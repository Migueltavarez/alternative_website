import { prisma } from '@/lib/prisma';

export async function getMessagesForUser(userId: string) {
  return prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function sendMessage(userId: string, sender: 'USER' | 'ADMIN', content: string, imageUrl?: string) {
  return prisma.chatMessage.create({
    data: {
      userId,
      sender,
      content,
      imageUrl: imageUrl ?? null,
      readByUser: sender === 'USER',
      readByAdmin: sender === 'ADMIN',
    },
  });
}

export async function markReadByUser(userId: string) {
  await prisma.chatMessage.updateMany({
    where: { userId, sender: 'ADMIN', readByUser: false },
    data: { readByUser: true },
  });
}

export async function markReadByAdmin(userId: string) {
  await prisma.chatMessage.updateMany({
    where: { userId, sender: 'USER', readByAdmin: false },
    data: { readByAdmin: true },
  });
}

export async function getConversationsForAdmin() {
  const existingUserIds = await prisma.user.findMany({ select: { id: true } }).then((u) => u.map((x) => x.id));

  const messages = await prisma.chatMessage.findMany({
    where: { userId: { in: existingUserIds } },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const byUser = new Map<
    string,
    { userId: string; name: string | null; email: string; lastMessage: typeof messages[number]; unreadCount: number }
  >();

  for (const m of messages) {
    if (!byUser.has(m.userId)) {
      byUser.set(m.userId, {
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        lastMessage: m,
        unreadCount: 0,
      });
    }
    if (m.sender === 'USER' && !m.readByAdmin) {
      byUser.get(m.userId)!.unreadCount++;
    }
  }

  return Array.from(byUser.values());
}

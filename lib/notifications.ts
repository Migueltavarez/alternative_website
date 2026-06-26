import prisma from './prisma';

export type NotifType = 'job_update' | 'message' | 'plan_expiry' | 'system';

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { userId, type, title, body, link: link ?? null },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH /api/admin/sellers/commissions — mark commission(s) as paid
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { commissionId, sellerId } = await request.json();

    if (commissionId) {
      await prisma.sellerCommission.update({
        where: { id: commissionId },
        data: { status: 'paid', paidAt: new Date() },
      });
    } else if (sellerId) {
      // Pay all pending for this seller
      await prisma.sellerCommission.updateMany({
        where: { sellerId, status: 'pending' },
        data: { status: 'paid', paidAt: new Date() },
      });
    } else {
      return NextResponse.json({ error: 'Se requiere commissionId o sellerId' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pay commission error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

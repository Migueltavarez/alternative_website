import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { paymentProofUrl, paymentMethod } = body;

    if (!paymentProofUrl) {
      return NextResponse.json({ error: 'URL del comprobante requerida' }, { status: 400 });
    }

    const printJob = await prisma.printJob.findUnique({ where: { id } });

    if (!printJob) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    if (printJob.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (printJob.priceStatus !== 'validated') {
      return NextResponse.json({ error: 'El trabajo no está listo para pago' }, { status: 400 });
    }

    const updated = await prisma.printJob.update({
      where: { id },
      data: {
        priceStatus: 'payment_uploaded',
        paymentProofUrl,
        paymentMethod: paymentMethod || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Payment proof error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

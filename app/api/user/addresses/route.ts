import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAddressesByUserId, createAddress } from '@/services/address.service';

export const dynamic = 'force-dynamic';

const REQUIRED_FIELDS = ['label', 'recipientName', 'phone', 'street', 'sector', 'city', 'province'];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await getAddressesByUserId((session.user as any).id);
    return NextResponse.json(addresses);
  } catch (error: any) {
    console.error('Get addresses error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || String(body[field]).trim() === '') {
        return NextResponse.json({ error: `El campo "${field}" es requerido` }, { status: 400 });
      }
    }

    const address = await createAddress((session.user as any).id, {
      label: body.label,
      recipientName: body.recipientName,
      phone: body.phone,
      street: body.street,
      sector: body.sector,
      city: body.city,
      province: body.province,
      notes: body.notes,
      isDefault: body.isDefault,
    });

    return NextResponse.json(address);
  } catch (error: any) {
    console.error('Create address error:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 400 });
  }
}

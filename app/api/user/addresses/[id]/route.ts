import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateAddress, deleteAddress } from '@/services/address.service';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const address = await updateAddress((session.user as any).id, params.id, body);
    return NextResponse.json(address);
  } catch (error: any) {
    console.error('Update address error:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteAddress((session.user as any).id, params.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateUserProfile } from '@/services/user.service';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, cedula, birthDate } = body;

    if (!phone || !cedula || !birthDate) {
      return NextResponse.json({ error: 'Teléfono, cédula y fecha de nacimiento son requeridos' }, { status: 400 });
    }

    const parsedDate = new Date(birthDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Fecha de nacimiento inválida' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const user = await updateUserProfile(userId, {
      phone: String(phone).trim(),
      cedula: String(cedula).trim(),
      birthDate: parsedDate,
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

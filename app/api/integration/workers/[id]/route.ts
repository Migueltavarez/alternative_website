import { NextRequest, NextResponse } from 'next/server';
import { isIntegrationRequest } from '@/lib/integration-auth';
import { approveWorker, rejectWorker } from '@/lib/workers-approval';

export const dynamic = 'force-dynamic';

// POST /api/integration/workers/[id] — body: { action: 'approve' | 'reject', reason?: string }
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isIntegrationRequest(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  let body: { action?: unknown; reason?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Se espera JSON' }, { status: 400 });
  }
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : null;

  const result =
    body.action === 'approve'
      ? await approveWorker(params.id)
      : body.action === 'reject'
        ? await rejectWorker(params.id, reason)
        : null;
  if (!result) return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, action: result.action });
}

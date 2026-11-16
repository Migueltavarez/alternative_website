import { NextRequest, NextResponse } from 'next/server';
import { isIntegrationRequest } from '@/lib/integration-auth';
import { listPendingWorkers } from '@/lib/workers-approval';

export const dynamic = 'force-dynamic';

// GET /api/integration/workers/pending — para n8n (Bearer INTEGRATION_API_KEY)
export async function GET(request: NextRequest) {
  if (!isIntegrationRequest(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const pending = await listPendingWorkers();
  return NextResponse.json({ pending });
}

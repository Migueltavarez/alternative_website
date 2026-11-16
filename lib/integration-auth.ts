import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * Acceso para sistemas (n8n), separado de las sesiones de personas.
 *
 * - Entrante: `Authorization: Bearer <INTEGRATION_API_KEY>` en las rutas `/api/integration/*`.
 * - Saliente: avisos a `INTEGRATION_WEBHOOK_URL` con el encabezado `x-alt3d-token`
 *   (`INTEGRATION_WEBHOOK_TOKEN`). Si no están configurados, no se avisa y no pasa nada.
 */

function igualSeguro(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** true solo si la petición trae la clave de integración (mínimo 32 caracteres). */
export function isIntegrationRequest(req: NextRequest): boolean {
  const key = process.env.INTEGRATION_API_KEY ?? '';
  if (key.length < 32) return false;
  const header = req.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) return false;
  return igualSeguro(header.slice(7).trim(), key);
}

export type IntegrationEvent = 'worker.registered';

/**
 * Avisa a n8n de un evento. Nunca lanza ni demora la respuesta al usuario: si n8n no contesta,
 * se anota en el log y n8n lo recoge después con `GET /api/integration/workers/pending`.
 */
export function notifyIntegration(event: IntegrationEvent, data: Record<string, unknown>): void {
  const url = process.env.INTEGRATION_WEBHOOK_URL ?? '';
  const token = process.env.INTEGRATION_WEBHOOK_TOKEN ?? '';
  if (!url || !token) return;
  const body = JSON.stringify({ event, at: new Date().toISOString(), data });
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-alt3d-token': token },
    body,
    signal: AbortSignal.timeout(8000),
  })
    .then((r) => {
      if (!r.ok) console.warn(`[integration] n8n respondió ${r.status} al evento ${event}`);
    })
    .catch((e: unknown) => {
      console.warn(`[integration] no se pudo avisar a n8n (${event}):`, e instanceof Error ? e.message : e);
    });
}

const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

export function getClientIp(req: Request | { headers: { get(k: string): string | null } }): string {
  const fwd = (req.headers as any).get?.('x-forwarded-for') as string | null;
  const real = (req.headers as any).get?.('x-real-ip') as string | null;
  return fwd?.split(',')[0].trim() || real || 'unknown';
}

import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { getCurrentUser, type CurrentUser } from './session';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export const fail = (status: number, error: string) => json({ error }, status);

/** CSRF defence for cookie auth: SameSite=Lax cookie + same-origin check + JSON-only bodies. */
export function checkOrigin(req: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const origin = req.headers.get('origin');
  if (origin) { try { return new URL(origin).host === req.headers.get('host'); } catch { return false; } }
  return req.headers.get('sec-fetch-site') !== 'cross-site';
}

type Ctx<P> = { params: Promise<P> };
export function route<P = Record<string, never>>(opts: { auth?: boolean }, h: (req: Request, user: CurrentUser, p: P) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      if (!checkOrigin(req)) return fail(403, 'Cross-origin request blocked.');
      const user = opts.auth === false ? null : await getCurrentUser();
      if (opts.auth !== false && !user) return fail(401, 'Not signed in.');
      return await h(req, user as CurrentUser, await ctx.params);
    } catch (e) {
      if (e instanceof ZodError) return fail(400, e.issues[0]?.message ?? 'Invalid input.');
      if (e instanceof SyntaxError) return fail(400, 'Invalid JSON.');
      console.error(e);
      return fail(500, 'Server error.');
    }
  };
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  return schema.parse(await req.json());
}

// Small in-memory limiter (per server process). Use a shared store (Redis) if you run multiple instances.
const hits = new Map<string, number[]>();
export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return arr.length > max;
}
export const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Readiness probe: confirms the app can reach PostgreSQL without exposing internals. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'connected' }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ status: 'unavailable', database: 'disconnected' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

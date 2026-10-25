'use client';
export async function api<T = unknown>(url: string, method = 'GET', data?: unknown): Promise<T> {
  const r = await fetch(url, { method, headers: data ? { 'Content-Type': 'application/json' } : undefined, body: data ? JSON.stringify(data) : undefined, credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error ?? 'Request failed.'), { status: r.status });
  return j as T;
}

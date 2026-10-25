import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

export const COOKIE = 'mirage_session';
const TTL_MS = 14 * 24 * 3600 * 1000;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.session.create({ data: { userId, tokenHash: sha(token), expiresAt } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha(token) } });
  jar.delete(COOKIE);
}

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'ANALYST' | 'VIEWER';
export type CurrentUser = { id: string; email: string; name: string; workspaceId: string; workspaceName: string; theme: string; role: WorkspaceRole };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({ where: { tokenHash: sha(token) }, include: { user: { include: { workspace: true, memberships: { include: { workspace: true }, orderBy: { createdAt: 'asc' }, take: 1 } } } } });
  if (!s || s.expiresAt < new Date()) return null;
  const { user } = s;
  const membership = user.memberships[0];
  const workspace = membership?.workspace ?? user.workspace;
  if (!workspace) return null;
  const role: WorkspaceRole = user.workspace?.id === workspace.id ? 'OWNER' : (membership?.role as WorkspaceRole) ?? 'ANALYST';
  return { id: user.id, email: user.email, name: user.name, workspaceId: workspace.id, workspaceName: workspace.name, theme: workspace.theme, role };
}

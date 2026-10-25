import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { createInvestigation, serializeInvestigation } from '@/lib/investigations';
import Lab from './components/Lab';
import type { Severity, ServerEventDTO } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  let list = await db.investigation.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { updatedAt: 'desc' }, take: 200 });
  if (!list.length) list = [await createInvestigation(user.workspaceId, 'My first investigation')];
  const active = list[0];
  const rows = await db.investigationEvent.findMany({ where: { investigationId: active.id }, orderBy: { seq: 'desc' }, take: 100 });
  const events: ServerEventDTO[] = rows.map(e => ({ seq: e.seq, title: e.title, detail: e.detail, severity: e.severity as Severity, node: e.node, occurredAt: e.occurredAt.toISOString() }));
  return <Lab user={{ name: user.name, email: user.email, workspaceName: user.workspaceName, theme: user.theme === 'light' ? 'light' : 'dark' }} investigations={list.map(serializeInvestigation)} active={serializeInvestigation(active)} events={events} />;
}

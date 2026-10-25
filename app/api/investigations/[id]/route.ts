import { z } from 'zod';
import { db } from '@/lib/db';
import { body, fail, json, route } from '@/lib/api';
import { findOwned, serializeInvestigation } from '@/lib/investigations';

type P = { id: string };

export const GET = route<P>({}, async (_r, user, { id }) => {
  const inv = await findOwned(user.id, id);
  if (!inv) return fail(404, 'Investigation not found.');
  const events = await db.investigationEvent.findMany({ where: { investigationId: id }, orderBy: { seq: 'desc' }, take: 100 });
  return json({ investigation: serializeInvestigation(inv), events: events.map(e => ({ seq: e.seq, title: e.title, detail: e.detail, severity: e.severity, node: e.node, occurredAt: e.occurredAt.toISOString() })) });
});

const patch = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  analystNotes: z.string().max(10000).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
  scenario: z.string().max(60).optional(), speed: z.enum(['Slow', 'Guided', 'Fast']).optional(),
  decoys: z.record(z.string().max(60), z.boolean()).refine(o => Object.keys(o).length <= 10).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  runs: z.number().int().min(0).max(1_000_000).optional(), caught: z.number().int().min(0).max(1_000_000).optional(), missed: z.number().int().min(0).max(1_000_000).optional(),
});

export const PATCH = route<P>({}, async (req, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  const d = await body(req, patch);
  const before = await findOwned(user.id, id);
  if (!before) return fail(404, 'Investigation not found.');
  if (d.assignedToId !== undefined && d.assignedToId !== null) {
    const member = await db.workspaceMembership.findFirst({ where: { workspaceId: user.workspaceId, userId: d.assignedToId } });
    const owner = await db.workspace.findFirst({ where: { id: user.workspaceId, ownerId: d.assignedToId } });
    if (!member && !owner) return fail(400, 'Assignee must be a member of this workspace.');
  }
  if (user.role === 'VIEWER') return fail(403, 'Viewers cannot edit investigations.');
  const updated = await db.investigation.update({ where: { id }, data: d });
  const labels: Record<string, string> = { title: 'title', status: 'status', priority: 'priority', analystNotes: 'analyst notes', assignedToId: 'assignee', scenario: 'scenario', speed: 'simulation speed', riskScore: 'risk score' };
  const changes = Object.entries(d).filter(([key, value]) => JSON.stringify((before as unknown as Record<string, unknown>)[key]) !== JSON.stringify(value));
  if (changes.length) {
    await db.investigationActivity.createMany({ data: changes.map(([key, value]) => ({
      investigationId: id, actorId: user.id, actorName: user.name, action: 'CASE_UPDATED',
      detail: key === 'analystNotes' ? 'Updated analyst notes.' : `Updated ${labels[key] ?? key} to ${typeof value === 'string' ? value.slice(0, 120) : (JSON.stringify(value) ?? String(value)).slice(0, 120)}.`,
    })) });
  }
  return json({ investigation: serializeInvestigation(updated) });
});

export const DELETE = route<P>({}, async (_r, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  await db.investigation.delete({ where: { id } });
  return json({ ok: true });
});

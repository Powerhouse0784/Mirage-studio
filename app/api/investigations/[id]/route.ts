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
  scenario: z.string().max(60).optional(), speed: z.enum(['Slow', 'Guided', 'Fast']).optional(),
  decoys: z.record(z.string().max(60), z.boolean()).refine(o => Object.keys(o).length <= 10).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  runs: z.number().int().min(0).max(1_000_000).optional(), caught: z.number().int().min(0).max(1_000_000).optional(), missed: z.number().int().min(0).max(1_000_000).optional(),
});

export const PATCH = route<P>({}, async (req, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  const d = await body(req, patch);
  return json({ investigation: serializeInvestigation(await db.investigation.update({ where: { id }, data: d })) });
});

export const DELETE = route<P>({}, async (_r, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  await db.investigation.delete({ where: { id } });
  return json({ ok: true });
});

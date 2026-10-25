import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { body, fail, json, route } from '@/lib/api';
import { findOwned } from '@/lib/investigations';

type P = { id: string };
const input = z.object({
  title: z.string().trim().min(1).max(160),
  kind: z.enum(['LOG', 'NOTE', 'URL', 'ARTIFACT', 'SCREENSHOT_REFERENCE']),
  description: z.string().trim().min(1).max(12000),
  sourceUrl: z.string().trim().max(2048).url().nullable().optional(),
});
const digest = (record: { title: string; kind: string; description: string; sourceUrl: string | null }) => createHash('sha256').update(JSON.stringify(record)).digest('hex');

export const GET = route<P>({}, async (_req, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  const rows = await db.evidenceItem.findMany({ where: { investigationId: id }, orderBy: { createdAt: 'desc' }, take: 300 });
  return json({ evidence: rows.map(row => ({ id: row.id, title: row.title, kind: row.kind, description: row.description, sourceUrl: row.sourceUrl, sha256: row.sha256, createdAt: row.createdAt.toISOString(), createdBy: row.createdBy })) });
});

export const POST = route<P>({}, async (req, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  const data = await body(req, input);
  if (data.sourceUrl && !['http:', 'https:'].includes(new URL(data.sourceUrl).protocol)) return fail(400, 'Source URL must use HTTP or HTTPS.');
  const count = await db.evidenceItem.count({ where: { investigationId: id } });
  if (count >= 300) return fail(409, 'Evidence record limit reached for this case (300).');
  const sourceUrl = data.sourceUrl || null;
  const sha256 = digest({ title: data.title, kind: data.kind, description: data.description, sourceUrl });
  const created = await db.$transaction(async tx => {
    const row = await tx.evidenceItem.create({ data: { investigationId: id, title: data.title, kind: data.kind, description: data.description, sourceUrl, sha256, createdBy: user.name } });
    await tx.investigationActivity.create({ data: { investigationId: id, actorId: user.id, actorName: user.name, action: 'EVIDENCE_ADDED', detail: `Added evidence record: ${data.title}` } });
    return row;
  });
  return json({ evidence: { id: created.id, title: created.title, kind: created.kind, description: created.description, sourceUrl: created.sourceUrl, sha256: created.sha256, createdAt: created.createdAt.toISOString(), createdBy: created.createdBy } }, 201);
});

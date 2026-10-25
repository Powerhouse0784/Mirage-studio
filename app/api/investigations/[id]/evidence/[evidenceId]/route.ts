import { db } from '@/lib/db';
import { fail, json, route } from '@/lib/api';
import { findOwned } from '@/lib/investigations';

type P = { id: string; evidenceId: string };
export const DELETE = route<P>({}, async (_req, user, { id, evidenceId }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  const existing = await db.evidenceItem.findFirst({ where: { id: evidenceId, investigationId: id } });
  if (!existing) return fail(404, 'Evidence record not found.');
  await db.$transaction(async tx => {
    await tx.evidenceItem.delete({ where: { id: evidenceId } });
    await tx.investigationActivity.create({ data: { investigationId: id, actorId: user.id, actorName: user.name, action: 'EVIDENCE_DELETED', detail: `Deleted evidence record: ${existing.title}` } });
  });
  return json({ deleted: true });
});

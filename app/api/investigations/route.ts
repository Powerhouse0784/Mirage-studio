import { z } from 'zod';
import { db } from '@/lib/db';
import { body, json, route } from '@/lib/api';
import { createInvestigation, serializeInvestigation } from '@/lib/investigations';

export const GET = route({}, async (_r, user) => {
  const list = await db.investigation.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { updatedAt: 'desc' }, take: 200 });
  return json({ investigations: list.map(serializeInvestigation) });
});

export const POST = route({}, async (req, user) => {
  const { title } = await body(req, z.object({ title: z.string().trim().min(1).max(120) }));
  const count = await db.investigation.count({ where: { workspaceId: user.workspaceId } });
  if (count >= 200) return json({ error: 'Investigation limit reached (200).' }, 409);
  return json({ investigation: serializeInvestigation(await createInvestigation(user.workspaceId, title)) }, 201);
});

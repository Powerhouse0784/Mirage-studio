import { z } from 'zod';
import { db } from '@/lib/db';
import { body, json, route } from '@/lib/api';
const schema = z.object({ theme: z.enum(['dark', 'light']).optional(), name: z.string().trim().min(1).max(60).optional() });
export const PATCH = route({}, async (req, user) => {
  const d = await body(req, schema);
  const w = await db.workspace.update({ where: { id: user.workspaceId }, data: d });
  return json({ name: w.name, theme: w.theme });
});

import { z } from 'zod';
import { body, fail, json, route } from '@/lib/api';
import { appendEvents, findOwned, SEVERITIES } from '@/lib/investigations';

const ev = z.object({ title: z.string().trim().min(1).max(200), detail: z.string().max(2000), severity: z.enum(SEVERITIES), node: z.string().max(80).nullish() });

export const POST = route<{ id: string }>({}, async (req, user, { id }) => {
  const inv = await findOwned(user.id, id);
  if (!inv) return fail(404, 'Investigation not found.');
  const { events } = await body(req, z.object({ events: z.array(ev).min(1).max(50) }));
  const rows = await appendEvents(id, events);
  return json({ appended: rows.length, eventCount: rows.at(-1)!.seq }, 201);
});

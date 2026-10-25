import { z } from 'zod';
import { db } from '@/lib/db';
import { body, fail, json, limited, clientIp, route } from '@/lib/api';
import { DUMMY_HASH, verifyPassword } from '@/lib/passwords';
import { createSession } from '@/lib/session';

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(200) });

export const POST = route({ auth: false }, async req => {
  const d = await body(req, schema);
  if (limited('login:' + clientIp(req) + ':' + d.email, 8, 15 * 60_000)) return fail(429, 'Too many attempts. Try again in a few minutes.');
  const user = await db.user.findUnique({ where: { email: d.email } });
  const ok = await verifyPassword(d.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return fail(401, 'Incorrect email or password.');
  await createSession(user.id);
  return json({ ok: true });
});

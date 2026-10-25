import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';
import { body, fail, json, limited, clientIp, route } from '@/lib/api';
import { hashPassword } from '@/lib/passwords';
import { createSession } from '@/lib/session';
import { createInvestigation } from '@/lib/investigations';

const schema = z.object({ name: z.string().trim().min(1, 'Name is required.').max(80), email: z.string().trim().toLowerCase().email('Enter a valid email.').max(254), password: z.string().min(10, 'Password must be at least 10 characters.').max(200) });

export const POST = route({ auth: false }, async req => {
  if (limited('reg:' + clientIp(req), 10, 3600_000)) return fail(429, 'Too many attempts. Try again later.');
  const d = await body(req, schema);
  try {
    const user = await db.user.create({ data: { email: d.email, name: d.name, passwordHash: await hashPassword(d.password), workspace: { create: {} } }, include: { workspace: true } });
    await createInvestigation(user.workspace!.id, 'My first investigation');
    await createSession(user.id);
    return json({ ok: true }, 201);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return fail(409, 'An account with that email already exists.');
    throw e;
  }
});

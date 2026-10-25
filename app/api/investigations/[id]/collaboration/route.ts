import { z } from 'zod';
import { db } from '@/lib/db';
import { body, fail, json, route } from '@/lib/api';
import { findOwned } from '@/lib/investigations';

type P = { id: string };

export const GET = route<P>({}, async (_req, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  const [comments, activity] = await Promise.all([
    db.investigationComment.findMany({ where: { investigationId: id }, include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    db.investigationActivity.findMany({ where: { investigationId: id }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  return json({
    comments: comments.map(c => ({ id: c.id, body: c.body, author: c.author.name, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), mine: c.authorId === user.id })),
    activity: activity.map(a => ({ id: a.id, actor: a.actorName, action: a.action, detail: a.detail, createdAt: a.createdAt.toISOString() })),
  });
});

export const POST = route<P>({}, async (req, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  const { comment } = await body(req, z.object({ comment: z.string().trim().min(1).max(4000) }));
  const created = await db.$transaction(async tx => {
    const row = await tx.investigationComment.create({ data: { investigationId: id, authorId: user.id, body: comment }, include: { author: { select: { name: true } } } });
    await tx.investigationActivity.create({ data: { investigationId: id, actorId: user.id, actorName: user.name, action: 'COMMENT_ADDED', detail: 'Added a case comment.' } });
    return row;
  });
  return json({ comment: { id: created.id, body: created.body, author: created.author.name, createdAt: created.createdAt.toISOString(), updatedAt: created.updatedAt.toISOString(), mine: true } }, 201);
});

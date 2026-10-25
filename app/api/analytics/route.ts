import { db } from '@/lib/db';
import { json, route } from '@/lib/api';

const validDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const GET = route({}, async (req, user) => {
  const url = new URL(req.url);
  const startParam = url.searchParams.get('start');
  const endParam = url.searchParams.get('end');
  const scenario = (url.searchParams.get('scenario') ?? '').trim().slice(0, 80);
  const start = validDate(startParam);
  const end = validDate(endParam);
  if (startParam && !start) return json({ error: 'Invalid start date.' }, 400);
  if (endParam && !end) return json({ error: 'Invalid end date.' }, 400);
  if (start && end && start > end) return json({ error: 'Start date must be on or before end date.' }, 400);

  const where = {
    userId: user.id,
    ...(start || end ? { completedAt: { ...(start ? { gte: start } : {}), ...(end ? { lt: new Date(end.getTime() + 86400000) } : {}) } } : {}),
    ...(scenario && scenario !== 'all' ? { scenario } : {}),
  };
  const runs = await db.simulationRun.findMany({
    where,
    orderBy: { completedAt: 'desc' },
    take: 1000,
    select: { id: true, investigationId: true, scenario: true, detected: true, enabledDecoys: true, eventCount: true, completedAt: true },
  });
  return json({ runs: runs.map(run => ({ ...run, completedAt: run.completedAt.toISOString() })), truncated: runs.length === 1000 });
});

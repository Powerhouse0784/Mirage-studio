import { z } from 'zod';
import { db } from '@/lib/db';
import { body, json, route } from '@/lib/api';

const todayKey = () => new Date().toISOString().slice(0, 10);
const ACHIEVEMENTS = [
  { key: 'first-steps', title: 'First steps' },
  { key: 'signal-finder', title: 'Signal finder' },
  { key: 'persistent-analyst', title: 'Persistent analyst' },
  { key: 'evidence-keeper', title: 'Evidence keeper' },
] as const;

export const GET = route({}, async (_req, user) => {
  const runs = await db.simulationRun.findMany({ where: { userId: user.id }, orderBy: { completedAt: 'desc' }, take: 100 });
  return json({ runs: runs.map(r => ({ id: r.id, investigationId: r.investigationId, scenario: r.scenario, detected: r.detected, enabledDecoys: r.enabledDecoys, eventCount: r.eventCount, completedAt: r.completedAt.toISOString() })) });
});

export const POST = route({}, async (req, user) => {
  const input = await body(req, z.object({ investigationId: z.string().min(1), scenario: z.string().min(1).max(80), detected: z.boolean(), enabledDecoys: z.number().int().min(0).max(5), eventCount: z.number().int().min(0).max(100000) }));
  const inv = await db.investigation.findFirst({ where: { id: input.investigationId, workspace: { ownerId: user.id } }, select: { id: true } });
  if (!inv) return json({ error: 'Investigation not found.' }, 404);
  const result = await db.$transaction(async tx => {
    const run = await tx.simulationRun.create({ data: { userId: user.id, investigationId: inv.id, scenario: input.scenario, detected: input.detected, enabledDecoys: input.enabledDecoys, eventCount: input.eventCount } });
    await tx.learningMission.upsert({ where: { userId_missionKey: { userId: user.id, missionKey: 'mission-first' } }, create: { userId: user.id, missionKey: 'mission-first' }, update: {} });
    if (input.enabledDecoys >= 3) {
      await tx.learningMission.upsert({ where: { userId_missionKey: { userId: user.id, missionKey: 'mission-decoy' } }, create: { userId: user.id, missionKey: 'mission-decoy' }, update: {} });
      const dateKey = todayKey();
      await tx.dailyChallenge.upsert({ where: { userId_dateKey: { userId: user.id, dateKey } }, create: { userId: user.id, dateKey, qualifyingRunId: run.id }, update: { qualifyingRunId: run.id, reviewedEvidence: false, completedAt: null } });
    }
    const [count, caughtCount, evidenceCount] = await Promise.all([
      tx.simulationRun.count({ where: { userId: user.id } }),
      tx.simulationRun.count({ where: { userId: user.id, detected: true } }),
      tx.simulationRun.aggregate({ where: { userId: user.id }, _sum: { eventCount: true } }),
    ]);
    const unlocked: string[] = [];
    if (count >= 1) unlocked.push('first-steps');
    if (caughtCount >= 1) unlocked.push('signal-finder');
    if (count >= 5) unlocked.push('persistent-analyst');
    if ((evidenceCount._sum.eventCount ?? 0) >= 10) unlocked.push('evidence-keeper');
    for (const key of unlocked) await tx.achievementUnlock.upsert({ where: { userId_key: { userId: user.id, key } }, create: { userId: user.id, key }, update: {} });
    return { run, unlocked };
  });
  return json({ run: { id: result.run.id, investigationId: result.run.investigationId, scenario: result.run.scenario, detected: result.run.detected, enabledDecoys: result.run.enabledDecoys, eventCount: result.run.eventCount, completedAt: result.run.completedAt.toISOString() }, unlocked: result.unlocked }, 201);
});

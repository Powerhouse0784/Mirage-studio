import { z } from 'zod';
import { db } from '@/lib/db';
import { body, json, route } from '@/lib/api';

const todayKey = () => new Date().toISOString().slice(0, 10);
const missionKeys = ['mission-first', 'mission-decoy', 'mission-review'] as const;

export const GET = route({}, async (_req, user) => {
  const dateKey = todayKey();
  const [missions, achievements, challenge, runs] = await Promise.all([
    db.learningMission.findMany({ where: { userId: user.id }, orderBy: { completedAt: 'asc' } }),
    db.achievementUnlock.findMany({ where: { userId: user.id }, orderBy: { earnedAt: 'asc' } }),
    db.dailyChallenge.findUnique({ where: { userId_dateKey: { userId: user.id, dateKey } } }),
    db.simulationRun.findMany({ where: { userId: user.id }, orderBy: { completedAt: 'desc' }, take: 100 }),
  ]);
  return json({
    missions: missions.map(m => ({ id: m.missionKey, completedAt: m.completedAt.toISOString() })),
    achievements: achievements.map(a => ({ key: a.key, earnedAt: a.earnedAt.toISOString() })),
    dailyChallenge: { dateKey, qualifyingRun: Boolean(challenge?.qualifyingRunId), reviewedEvidence: Boolean(challenge?.reviewedEvidence), completed: Boolean(challenge?.completedAt), completedAt: challenge?.completedAt?.toISOString() ?? null },
    runs: runs.map(r => ({ id: r.id, investigationId: r.investigationId, scenario: r.scenario, detected: r.detected, enabledDecoys: r.enabledDecoys, eventCount: r.eventCount, completedAt: r.completedAt.toISOString() })),
  });
});

export const POST = route({}, async (req, user) => {
  const input = await body(req, z.discriminatedUnion('action', [
    z.object({ action: z.literal('mission'), missionId: z.enum(missionKeys), investigationId: z.string().min(1).optional(), enabledDecoys: z.number().int().min(0).max(5).optional() }),
    z.object({ action: z.literal('review-evidence'), investigationId: z.string().min(1) }),
  ]));
  const dateKey = todayKey();
  if (input.action === 'mission') {
    if (input.missionId === 'mission-first') {
      const hasRun = await db.simulationRun.count({ where: { userId: user.id } });
      if (!hasRun) return json({ error: 'Run a simulation before completing this mission.' }, 409);
    }
    if (input.missionId === 'mission-decoy') {
      const inv = input.investigationId ? await db.investigation.findFirst({ where: { id: input.investigationId, workspace: { ownerId: user.id } }, select: { decoys: true } }) : null;
      const actualCount = inv ? Object.values(inv.decoys as Record<string, boolean>).filter(Boolean).length : 0;
      if (actualCount < 3) return json({ error: 'Enable at least three deception assets first.' }, 409);
    }
    if (input.missionId === 'mission-review') {
      const [inv, runCount] = await Promise.all([
        db.investigation.findFirst({ where: { id: input.investigationId, workspace: { ownerId: user.id }, eventCount: { gt: 0 } }, select: { id: true } }),
        db.simulationRun.count({ where: { userId: user.id, investigationId: input.investigationId } }),
      ]);
      if (!inv || runCount < 1) return json({ error: 'Complete a simulation and review its recorded evidence before completing this mission.' }, 409);
    }
    const mission = await db.learningMission.upsert({ where: { userId_missionKey: { userId: user.id, missionKey: input.missionId } }, create: { userId: user.id, missionKey: input.missionId }, update: {} });
    return json({ mission: { id: mission.missionKey, completedAt: mission.completedAt.toISOString() } });
  }

  const inv = await db.investigation.findFirst({ where: { id: input.investigationId, workspace: { ownerId: user.id } }, select: { id: true, eventCount: true } });
  if (!inv || inv.eventCount < 1) return json({ error: 'No recorded evidence is available in this investigation yet.' }, 409);
  await db.learningMission.upsert({ where: { userId_missionKey: { userId: user.id, missionKey: 'mission-review' } }, create: { userId: user.id, missionKey: 'mission-review' }, update: {} });
  const challenge = await db.dailyChallenge.findUnique({ where: { userId_dateKey: { userId: user.id, dateKey } } });
  if (challenge?.qualifyingRunId) {
    await db.dailyChallenge.update({ where: { id: challenge.id }, data: { reviewedEvidence: true, completedAt: new Date() } });
  }
  const updatedChallenge = await db.dailyChallenge.findUnique({ where: { userId_dateKey: { userId: user.id, dateKey } } });
  return json({ reviewed: true, dailyChallenge: { dateKey, qualifyingRun: Boolean(updatedChallenge?.qualifyingRunId), reviewedEvidence: Boolean(updatedChallenge?.reviewedEvidence), completed: Boolean(updatedChallenge?.completedAt), completedAt: updatedChallenge?.completedAt?.toISOString() ?? null } });
});

import { db } from '@/lib/db';
import { fail, json, route } from '@/lib/api';
import { findOwned } from '@/lib/investigations';

type P = { id: string };

export const GET = route<P>({}, async (_req, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  const [events, runs, evidence, activity, comments] = await Promise.all([
    db.investigationEvent.findMany({ where: { investigationId: id }, orderBy: { occurredAt: 'desc' }, take: 300 }),
    db.simulationRun.findMany({ where: { investigationId: id, userId: user.id }, orderBy: { completedAt: 'desc' }, take: 200 }),
    db.evidenceItem.findMany({ where: { investigationId: id }, orderBy: { createdAt: 'desc' }, take: 300 }),
    db.investigationActivity.findMany({ where: { investigationId: id }, orderBy: { createdAt: 'desc' }, take: 300 }),
    db.investigationComment.findMany({ where: { investigationId: id }, orderBy: { createdAt: 'desc' }, take: 200, include: { author: { select: { name: true } } } }),
  ]);
  const items = [
    ...events.map(e => ({ id: `event-${e.id}`, type: 'EVENT', title: e.title, detail: e.detail, severity: e.severity, actor: e.node || 'Simulation event', at: e.occurredAt.toISOString(), meta: `Audit sequence #${e.seq}` })),
    ...runs.map(r => ({ id: `run-${r.id}`, type: 'SIMULATION', title: `${r.scenario} simulation completed`, detail: `${r.detected ? 'Threat detected' : 'Detection gap'} · ${r.enabledDecoys} enabled decoys · ${r.eventCount} generated events.`, severity: r.detected ? 'LOW' : 'HIGH', actor: 'Simulation engine', at: r.completedAt.toISOString(), meta: r.detected ? 'Detected' : 'Detection gap' })),
    ...evidence.map(e => ({ id: `evidence-${e.id}`, type: 'EVIDENCE', title: `Evidence added: ${e.title}`, detail: e.description, severity: 'INFO', actor: e.createdBy, at: e.createdAt.toISOString(), meta: `${e.kind} · SHA-256 ${e.sha256.slice(0, 12)}…` })),
    ...activity.map(a => ({ id: `activity-${a.id}`, type: 'CASE_ACTIVITY', title: a.action.replaceAll('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()), detail: a.detail, severity: 'INFO', actor: a.actorName, at: a.createdAt.toISOString(), meta: 'Case activity' })),
    ...comments.map(c => ({ id: `comment-${c.id}`, type: 'COMMENT', title: `Comment by ${c.author.name}`, detail: c.body, severity: 'INFO', actor: c.author.name, at: c.createdAt.toISOString(), meta: 'Analyst collaboration' })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 500);
  return json({ items, total: items.length });
});

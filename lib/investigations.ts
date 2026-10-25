import { Prisma } from '@/generated/prisma/client';
import { db } from './db';
import { computeHash, GENESIS, verifyChain, type ChainEvent } from './audit';
import type { InvestigationDTO } from './types';

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const DEFAULT_DECOYS = { 'Honey admin panel': true, 'Honey credentials': true, 'Honey SSH key': true, 'Honey backup vault': true, 'Honey database': true };
export type NewEvent = { title: string; detail: string; severity: string; node?: string | null };

const SEED: NewEvent[] = [
  { title: 'Lab environment initialized', detail: 'Simulation-only telemetry is ready. No live systems are connected.', severity: 'LOW' },
  { title: 'Decoy health check passed', detail: '4 of 4 configured deception assets are available.', severity: 'LOW' },
];

/** Ownership-scoped lookup: returns null for other users' investigations (same as "not found"). */
export function findOwned(userId: string, id: string) {
  return db.investigation.findFirst({ where: { id, OR: [{ workspace: { ownerId: userId } }, { workspace: { memberships: { some: { userId } } }] } });
}

/** Append events atomically, extending the hash chain. Row-locks the investigation so concurrent appends serialize. */
export async function appendEvents(investigationId: string, events: NewEvent[], tx?: Prisma.TransactionClient) {
  const run = async (t: Prisma.TransactionClient) => {
    await t.$queryRaw`SELECT id FROM "Investigation" WHERE id = ${investigationId} FOR UPDATE`;
    const inv = await t.investigation.findUniqueOrThrow({ where: { id: investigationId }, select: { eventCount: true, headHash: true } });
    let prev = inv.headHash || GENESIS;
    let seq = inv.eventCount;
    const base = Date.now();
    const rows = events.map((e, i) => {
      seq += 1;
      const f = { investigationId, seq, occurredAt: new Date(base + i), title: e.title, detail: e.detail, severity: e.severity, node: e.node ?? null };
      const hash = computeHash(prev, f);
      const row = { ...f, prevHash: prev, hash };
      prev = hash;
      return row;
    });
    await t.investigationEvent.createMany({ data: rows });
    await t.investigation.update({ where: { id: investigationId }, data: { eventCount: seq, headHash: prev } });
    return rows;
  };
  return tx ? run(tx) : db.$transaction(run);
}

export async function createInvestigation(workspaceId: string, title: string) {
  return db.$transaction(async tx => {
    const inv = await tx.investigation.create({ data: { workspaceId, title, decoys: DEFAULT_DECOYS } });
    await appendEvents(inv.id, SEED, tx);
    return tx.investigation.findUniqueOrThrow({ where: { id: inv.id } });
  });
}

export async function verifyInvestigation(id: string) {
  const inv = await db.investigation.findUniqueOrThrow({ where: { id } });
  const events = (await db.investigationEvent.findMany({ where: { investigationId: id }, orderBy: { seq: 'asc' } })) as ChainEvent[];
  return verifyChain(events, inv);
}

export function serializeInvestigation(i: NonNullable<Awaited<ReturnType<typeof findOwned>>>): InvestigationDTO {
  return {
    id: i.id,
    title: i.title,
    // Prisma stores these as strings; narrow them at the API boundary to the supported DTO unions.
    status: i.status as InvestigationDTO['status'],
    priority: i.priority as InvestigationDTO['priority'],
    analystNotes: i.analystNotes,
    assignedToId: i.assignedToId,
    scenario: i.scenario,
    speed: i.speed,
    decoys: i.decoys as Record<string, boolean>,
    riskScore: i.riskScore,
    runs: i.runs,
    caught: i.caught,
    missed: i.missed,
    eventCount: i.eventCount,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/passwords';

let stop: () => Promise<unknown>;
let db: typeof import('@/lib/db').db;
let inv: typeof import('@/lib/investigations');

async function user(email: string) {
  const u = await db.user.create({ data: { email, name: email, passwordHash: 'x', workspace: { create: {} } }, include: { workspace: true } });
  return { id: u.id, ws: u.workspace!.id };
}

beforeAll(async () => {
  const { startTestDb } = await import('./pg');
  const t = await startTestDb(54330); stop = t.stop;
  process.env.DATABASE_URL = t.url; process.env.AUDIT_HMAC_SECRET = 's'.repeat(40);
  ({ db } = await import('@/lib/db')); inv = await import('@/lib/investigations');
});
afterAll(async () => { await db?.$disconnect(); await stop?.(); });

describe('passwords', () => {
  it('hashes and verifies', async () => {
    const h = await hashPassword('correct horse battery');
    expect(h).not.toContain('correct');
    expect(await verifyPassword('correct horse battery', h)).toBe(true);
    expect(await verifyPassword('wrong', h)).toBe(false);
  });
});

describe('investigations + audit chain (real PostgreSQL)', () => {
  it('seeds, appends and verifies; survives concurrent appends', async () => {
    const a = await user('a@test.dev'); const i = await inv.createInvestigation(a.ws, 'Case 1');
    expect(i.eventCount).toBe(2);
    await Promise.all(Array.from({ length: 12 }, (_, n) => inv.appendEvents(i.id, [{ title: 'e' + n, detail: 'd', severity: 'LOW' }, { title: 'f' + n, detail: 'd', severity: 'HIGH', node: 'Web server' }])));
    const r = await inv.verifyInvestigation(i.id);
    expect(r).toMatchObject({ ok: true, count: 26 });
  });
  it('detects tampering done directly in the database', async () => {
    const a = await user('b@test.dev'); const i = await inv.createInvestigation(a.ws, 'Case 2');
    await inv.appendEvents(i.id, [{ title: 'x', detail: 'y', severity: 'LOW' }, { title: 'z', detail: 'y', severity: 'LOW' }]);
    await db.investigationEvent.updateMany({ where: { investigationId: i.id, seq: 2 }, data: { detail: 'edited' } });
    expect(await inv.verifyInvestigation(i.id)).toMatchObject({ ok: false, brokenAtSeq: 2 });
    await db.investigationEvent.updateMany({ where: { investigationId: i.id, seq: 2 }, data: { detail: 'Decoy health check passed' } }); // not original text either
    const j = await inv.createInvestigation(a.ws, 'Case 3');
    await db.investigationEvent.deleteMany({ where: { investigationId: j.id, seq: 2 } });
    expect((await inv.verifyInvestigation(j.id)).ok).toBe(false);
    const k = await inv.createInvestigation(a.ws, 'Case 4');
    await inv.appendEvents(k.id, [{ title: 'last', detail: 'd', severity: 'LOW' }]);
    await db.investigationEvent.deleteMany({ where: { investigationId: k.id, seq: 3 } });
    expect(await inv.verifyInvestigation(k.id)).toMatchObject({ ok: false, brokenAtSeq: null });
  });
  it('isolates users: nobody can read another user\'s investigation', async () => {
    const a = await user('c@test.dev'); const b = await user('d@test.dev');
    const i = await inv.createInvestigation(a.ws, 'Private');
    expect(await inv.findOwned(a.id, i.id)).not.toBeNull();
    expect(await inv.findOwned(b.id, i.id)).toBeNull();
  });
  it('cascades on delete', async () => {
    const a = await user('e@test.dev'); const i = await inv.createInvestigation(a.ws, 'Gone');
    await db.investigation.delete({ where: { id: i.id } });
    expect(await db.investigationEvent.count({ where: { investigationId: i.id } })).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { computeHash, GENESIS, verifyChain, type ChainEvent } from '@/lib/audit';

const KEY = 'k'.repeat(40);
function build(n: number): { events: ChainEvent[]; head: { eventCount: number; headHash: string } } {
  let prev = GENESIS; const events: ChainEvent[] = [];
  for (let i = 1; i <= n; i++) {
    const f = { investigationId: 'inv1', seq: i, occurredAt: new Date(1_700_000_000_000 + i), title: 't' + i, detail: 'd' + i, severity: 'LOW', node: i % 2 ? 'Web server' : null };
    const hash = computeHash(prev, f, KEY); events.push({ ...f, prevHash: prev, hash }); prev = hash;
  }
  return { events, head: { eventCount: n, headHash: prev } };
}
const clone = (e: ChainEvent[]) => e.map(x => ({ ...x }));

describe('audit hash chain', () => {
  it('verifies an intact chain, including empty', () => {
    const { events, head } = build(5);
    expect(verifyChain(events, head, KEY)).toMatchObject({ ok: true, count: 5 });
    expect(verifyChain([], { eventCount: 0, headHash: '' }, KEY).ok).toBe(true);
  });
  it('detects edited content', () => {
    const { events, head } = build(5); const e = clone(events); e[2].detail = 'changed';
    expect(verifyChain(e, head, KEY)).toMatchObject({ ok: false, brokenAtSeq: 3 });
  });
  it('detects edited timestamp, severity and node', () => {
    const { events, head } = build(4);
    for (const mut of [(x: ChainEvent) => { x.occurredAt = new Date(5); }, (x: ChainEvent) => { x.severity = 'HIGH'; }, (x: ChainEvent) => { x.node = 'x'; }]) {
      const e = clone(events); mut(e[1]); expect(verifyChain(e, head, KEY).ok).toBe(false);
    }
  });
  it('detects a deleted middle event, reordering and a removed tail', () => {
    const { events, head } = build(5);
    expect(verifyChain([...events.slice(0, 2), ...events.slice(3)], head, KEY).ok).toBe(false);
    expect(verifyChain([events[1], events[0], ...events.slice(2)], head, KEY).ok).toBe(false);
    expect(verifyChain(events.slice(0, 4), head, KEY)).toMatchObject({ ok: false, brokenAtSeq: null });
  });
  it('detects a recomputed chain made without the secret', () => {
    const { events } = build(3); const forged = clone(events); forged[1].title = 'evil';
    let prev = forged[0].hash;
    for (let i = 1; i < 3; i++) { forged[i].prevHash = prev; forged[i].hash = computeHash(prev, forged[i], 'wrong-key-'.repeat(5)); prev = forged[i].hash; }
    expect(verifyChain(forged, { eventCount: 3, headHash: prev }, KEY).ok).toBe(false);
  });
  it('is unambiguous across field boundaries', () => {
    const a = { investigationId: 'i', seq: 1, occurredAt: new Date(0), title: 'ab', detail: 'c', severity: 'LOW', node: null };
    const b = { ...a, title: 'a', detail: 'bc' };
    expect(computeHash(GENESIS, a, KEY)).not.toBe(computeHash(GENESIS, b, KEY));
  });
});

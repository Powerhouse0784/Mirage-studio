import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Tamper-evident audit chain.
 *
 * Each event's hash = HMAC-SHA256(secret, canonical(prevHash, investigationId, seq, fields)).
 * - Editing any field of any event breaks that event's hash.
 * - Deleting/reordering/inserting events breaks seq continuity or prevHash links.
 * - Deleting trailing events is caught by the head (eventCount + headHash) stored on the investigation.
 * - Because it is keyed (HMAC), someone with only database write access cannot recompute a valid chain.
 */
export const GENESIS = '0'.repeat(64);

export type ChainFields = {
  investigationId: string;
  seq: number;
  occurredAt: Date;
  title: string;
  detail: string;
  severity: string;
  node: string | null;
};
export type ChainEvent = ChainFields & { prevHash: string; hash: string };

function secret(): string {
  const s = process.env.AUDIT_HMAC_SECRET;
  if (!s || s.length < 32) throw new Error('AUDIT_HMAC_SECRET must be set (>= 32 chars).');
  return s;
}

export function canonical(prevHash: string, e: ChainFields): string {
  // JSON array: fixed field order, unambiguous escaping.
  return JSON.stringify([prevHash, e.investigationId, e.seq, e.occurredAt.toISOString(), e.title, e.detail, e.severity, e.node]);
}

export function computeHash(prevHash: string, e: ChainFields, key = secret()): string {
  return createHmac('sha256', key).update(canonical(prevHash, e)).digest('hex');
}

export type VerifyResult =
  | { ok: true; count: number; headHash: string }
  | { ok: false; count: number; brokenAtSeq: number | null; reason: string };

const eq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** events must be ordered by seq ascending and be the COMPLETE chain. */
export function verifyChain(events: ChainEvent[], head: { eventCount: number; headHash: string }, key = secret()): VerifyResult {
  let prev = GENESIS;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.seq !== i + 1) return { ok: false, count: events.length, brokenAtSeq: i + 1, reason: `Sequence gap: expected event #${i + 1}, found #${e.seq}.` };
    if (!eq(e.prevHash, prev)) return { ok: false, count: events.length, brokenAtSeq: e.seq, reason: `Event #${e.seq} does not link to the previous event.` };
    if (!eq(e.hash, computeHash(prev, e, key))) return { ok: false, count: events.length, brokenAtSeq: e.seq, reason: `Event #${e.seq} content does not match its recorded hash.` };
    prev = e.hash;
  }
  if (events.length !== head.eventCount) return { ok: false, count: events.length, brokenAtSeq: null, reason: `Chain has ${events.length} events but ${head.eventCount} were recorded (events removed).` };
  if (!eq(prev, head.headHash || GENESIS)) return { ok: false, count: events.length, brokenAtSeq: null, reason: 'Chain head does not match the recorded head hash.' };
  return { ok: true, count: events.length, headHash: prev };
}

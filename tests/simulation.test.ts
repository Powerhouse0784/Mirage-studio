import { describe, expect, it } from 'vitest';
import { buildSimulationFrames } from '@/app/components/NetworkLab';

const path = ['Internet', 'Edge gateway', 'Web server', 'Honey admin panel', 'App server'];

describe('simulation path logic', () => {
  it('stops at the first enabled decoy and records a detection outcome', () => {
    const frames = buildSimulationFrames(path, { 'Honey admin panel': true });
    expect(frames.at(-1)).toMatchObject({
      node: 'Honey admin panel',
      kind: 'detect',
      sev: 'HIGH',
      risk: 86,
    });
    expect(frames.some(frame => frame.node === 'App server')).toBe(false);
  });

  it('continues past disabled decoys and records a miss if none trigger', () => {
    const frames = buildSimulationFrames(path, { 'Honey admin panel': false });
    expect(frames.some(frame => frame.kind === 'bypass')).toBe(true);
    expect(frames.at(-1)).toMatchObject({ kind: 'miss', sev: 'CRITICAL', risk: 94 });
  });

  it('does not label normal production path activity as a detection', () => {
    const frames = buildSimulationFrames(['Internet', 'Edge gateway', 'Web server'], {});
    expect(frames.every(frame => frame.kind === 'act')).toBe(true);
    expect(frames.every(frame => frame.sev === 'LOW')).toBe(true);
  });
});

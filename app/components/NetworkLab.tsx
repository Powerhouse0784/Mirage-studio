'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, LockKeyhole, Server, Laptop, Database, HardDrive, Fingerprint, KeyRound, Terminal, Bot, Plus, Minus, Maximize2, Play, Pause, SkipBack, SkipForward, Crosshair } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Sev = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Frame = { node?: string; from?: string; title: string; detail: string; sev: Sev; risk: number; kind: 'act' | 'detect' | 'bypass' | 'miss' };
type Meta = { x: number; y: number; icon: LucideIcon; kind: 'external' | 'prod' | 'decoy'; ip: string; os: string; role: string; svc: string; crit: string; note: string };
const M = (x: number, y: number, icon: LucideIcon, kind: Meta['kind'], ip: string, os: string, role: string, svc: string, crit: string, note = ''): Meta => ({ x, y, icon, kind, ip, os, role, svc, crit, note });
const D = 'No legitimate user is told about this asset, so any interaction is a high-confidence signal.';
export const NODES: Record<string, Meta> = {
  'Internet': M(70, 300, Globe2, 'external', '0.0.0.0/0', 'n/a', 'Untrusted external network', 'HTTPS, scanners', 'n/a'),
  'Edge gateway': M(210, 300, LockKeyhole, 'prod', '10.0.0.1', 'Hardened Linux', 'Perimeter firewall and reverse proxy', '443/tcp', 'High'),
  'Web server': M(350, 110, Server, 'prod', '10.0.1.10', 'Ubuntu 22.04', 'Public website host', 'nginx 80/443', 'Medium'),
  'Employee laptop': M(350, 300, Laptop, 'prod', '10.0.5.31', 'Windows 11', 'Staff endpoint', 'RDP, SMB client', 'Medium'),
  'App server': M(350, 470, Terminal, 'prod', '10.0.2.20', 'RHEL 9', 'Business application tier', 'API 8443/tcp', 'High'),
  'Honey admin panel': M(530, 190, Fingerprint, 'decoy', '10.0.1.99', 'Emulated', 'Fake admin console lure', 'HTTP 8080', 'Decoy', D),
  'Honey credentials': M(650, 300, KeyRound, 'decoy', '10.0.5.98', 'Emulated', 'Fake password file lure', 'SMB file', 'Decoy', D),
  'Production DB': M(880, 170, Database, 'prod', '10.0.4.5', 'PostgreSQL 16', 'Customer records', '5432/tcp', 'Critical'),
  'File share': M(770, 420, HardDrive, 'prod', '10.0.3.15', 'Windows Server 2022', 'Departmental file storage', 'SMB 445', 'High'),
  'Honey SSH key': M(920, 330, KeyRound, 'decoy', '10.0.3.97', 'Emulated', 'Fake admin SSH key lure', 'SSH 22', 'Decoy', D),
  'Honey backup vault': M(920, 520, HardDrive, 'decoy', '10.0.3.96', 'Emulated', 'Fake backup repository lure', 'SMB 445', 'Decoy', D),
  'Workstation': M(550, 530, Bot, 'prod', '10.0.5.44', 'Windows 11', 'Operations endpoint', 'RDP, SMB client', 'Medium'),
  'Honey database': M(170, 520, Database, 'decoy', '10.0.2.95', 'Emulated', 'Fake database lure', 'PostgreSQL 5432', 'Decoy', D),
};
const K = (a: string, b: string) => (a < b ? a + '|' + b : b + '|' + a);

export function buildSimulationFrames(path: string[], dec: Record<string, boolean>): Frame[] {
  const f: Frame[] = []; let hit = false;
  for (let i = 0; i < path.length; i++) {
    const n = path[i], from = i ? path[i - 1] : undefined, r = Math.min(48, 12 + (i + 1) * 6);
    if (n.startsWith('Honey')) {
      if (dec[n]) { hit = true; f.push({ node: n, from, title: 'Deception asset triggered', detail: `Simulated intruder touched ${n}. High-confidence detection recorded.`, sev: 'HIGH', risk: 86, kind: 'detect' }); break; }
      f.push({ node: n, from, title: 'Decoy bypassed', detail: `${n} is disabled; the simulated path continued without a detection signal.`, sev: 'MEDIUM', risk: r, kind: 'bypass' });
    } else f.push({ node: n, from, title: 'Path activity observed', detail: `Simulated activity reached ${n}.`, sev: 'LOW', risk: r, kind: 'act' });
  }
  if (!hit) f.push({ title: 'Simulation ended without decoy detection', detail: 'The modeled path completed without triggering an enabled decoy. This is a lab result, not a real breach.', sev: 'CRITICAL', risk: 94, kind: 'miss' });
  return f;
}

type Props = { path: string[]; allPaths: string[][]; decoys: Record<string, boolean>; speed: string; runId: number; resetId: number; running: boolean; onToggle: (n: string) => void; onEvent: (t: string, d: string, s: Sev, n?: string) => void; onRisk: (n: number) => void; onProgress: (n: number) => void; onRunning: (b: boolean) => void; onDone: (hit: boolean, msg: string) => void };

export default function NetworkLab(p: Props) {
  const { path, allPaths, decoys, speed, runId, resetId, running } = p;
  const frames = useMemo(() => buildSimulationFrames(path, decoys), [path, decoys]);
  const [step, setStep] = useState(-1); const [playing, setPlaying] = useState(false); const [sel, setSel] = useState<string | null>(null);
  const [v, setV] = useState({ x: 0, y: 0, k: 1 });
  const live = useRef(false); const svgRef = useRef<SVGSVGElement>(null); const suppress = useRef(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const edges = useMemo(() => { const s = new Set<string>(); allPaths.forEach(a => a.forEach((n, i) => { if (i) s.add(K(a[i - 1], n)); })); return [...s].map(k => k.split('|')); }, [allPaths]);
  const planned = useMemo(() => new Set(path.slice(1).map((n, i) => K(path[i], n))), [path]);

  useEffect(() => { setPlaying(false); setStep(-1); live.current = false; p.onProgress(0); p.onRunning(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [frames, resetId]);
  useEffect(() => {
    if (!runId) return; live.current = true; setStep(-1); setPlaying(true); p.onRunning(true); p.onProgress(0);
    p.onEvent('Simulation started', 'Attack path replay launched in isolated demo mode.', 'LOW');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);
  useEffect(() => {
    if (!playing) return;
    const wait = speed === 'Fast' ? 350 : speed === 'Guided' ? 850 : 1350;
    const t = setTimeout(() => {
      const n = step + 1;
      if (n >= frames.length) { setPlaying(false); return; }
      const fr = frames[n]; setStep(n); p.onRisk(fr.risk); p.onProgress(Math.round(((n + 1) / frames.length) * 100));
      const last = n === frames.length - 1;
      if (live.current) {
        p.onEvent(fr.title, fr.detail, fr.sev, fr.node);
        if (last) { live.current = false; setPlaying(false); p.onRunning(false); const hit = fr.kind === 'detect'; p.onDone(hit, hit ? `Intruder detected at ${fr.node}. The simulated session has been contained.` : 'No active decoy intercepted this path. Review placement and rerun the scenario.'); }
      } else if (last) setPlaying(false);
    }, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step, frames, speed]);

  function go(i: number) {
    const j = Math.max(-1, Math.min(frames.length - 1, i));
    if (live.current) { live.current = false; p.onRunning(false); }
    setPlaying(false); setStep(j); p.onRisk(j < 0 ? 12 : frames[j].risk); p.onProgress(j < 0 ? 0 : Math.round(((j + 1) / frames.length) * 100));
  }
  function toggle() { if (playing) { setPlaying(false); return; } if (step >= frames.length - 1) setStep(-1); live.current = false; setPlaying(true); }

  const zoom = (f: number, cx = 500, cy = 300) => setV(o => { const k = Math.min(3, Math.max(0.6, o.k * f)), r = k / o.k; return { k, x: cx - (cx - o.x) * r, y: cy - (cy - o.y) * r }; });
  useEffect(() => {
    const s = svgRef.current; if (!s) return;
    const h = (e: WheelEvent) => { e.preventDefault(); const r = s.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.12 : 0.89, ((e.clientX - r.left) * 1000) / r.width, ((e.clientY - r.top) * 600) / r.height); };
    s.addEventListener('wheel', h, { passive: false }); return () => s.removeEventListener('wheel', h);
  }, []);
  const focus = (n: string) => setV(() => { const k = 1.8; return { k, x: 500 - NODES[n].x * k, y: 300 - NODES[n].y * k }; });

  const cur = step >= 0 ? frames[step] : undefined;
  const seen = new Map<string, Frame>(); frames.slice(0, step + 1).forEach(f => { if (f.node) seen.set(f.node, f); });
  const done = new Set(frames.slice(0, step + 1).filter(f => f.from && f.node).map(f => K(f.from!, f.node!)));
  const curKey = cur?.from && cur.node ? K(cur.from, cur.node) : '';
  const selMeta = sel ? NODES[sel] : null; const selFrame = sel ? seen.get(sel) : undefined;
  const nbrs = sel ? edges.filter(e => e.includes(sel)).map(e => (e[0] === sel ? e[1] : e[0])) : [];
  const status = running ? 'SIMULATION RUNNING' : cur ? `REPLAY · STEP ${step + 1}/${frames.length}` : 'AWAITING SIMULATION';

  return <div className="nl">
    <div className="nl-canvas" onKeyDown={e => { if (e.key === '+' || e.key === '=') zoom(1.2); if (e.key === '-') zoom(0.83); if (e.key === '0') setV({ x: 0, y: 0, k: 1 }); }}>
      <div className="nl-top"><span><span className="live-dot" /> {status}</span><span>Scroll to zoom · drag to pan · click a node</span></div>
      <svg ref={svgRef} viewBox="0 0 1000 600" role="group" aria-label="Interactive network topology" style={{ touchAction: v.k > 1 ? 'none' : 'pan-y' }}
        onPointerDown={e => { drag.current = { x: e.clientX, y: e.clientY, ox: v.x, oy: v.y, moved: false }; }}
        onPointerMove={e => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (!d.moved) { if (Math.hypot(dx, dy) < 5) return; d.moved = true; e.currentTarget.setPointerCapture(e.pointerId); } const r = e.currentTarget.getBoundingClientRect(); setV(o => ({ ...o, x: d.ox + (dx * 1000) / r.width, y: d.oy + (dy * 600) / r.height })); }}
        onPointerUp={e => { const d = drag.current; drag.current = null; if (d?.moved) { e.currentTarget.releasePointerCapture(e.pointerId); suppress.current = true; setTimeout(() => { suppress.current = false; }, 0); } }}
        onClick={e => { if (e.target === e.currentTarget && !suppress.current) setSel(null); }}>
        <defs><filter id="nlglow"><feGaussianBlur stdDeviation="5" /></filter></defs>
        <g transform={`translate(${v.x} ${v.y}) scale(${v.k})`}>
          {edges.map(([a, b]) => { const k = K(a, b), dc = NODES[a].kind === 'decoy' || NODES[b].kind === 'decoy'; return <line key={k} className={`nl-e ${dc ? 'dc' : ''} ${planned.has(k) ? 'pl' : ''} ${done.has(k) ? 'dn' : ''} ${k === curKey ? 'cu' : ''}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} />; })}
          {cur?.from && cur.node && <circle key={step} r="6" className="nl-pkt"><animateMotion dur="0.7s" fill="freeze" path={`M${NODES[cur.from].x} ${NODES[cur.from].y} L${NODES[cur.node].x} ${NODES[cur.node].y}`} /></circle>}
          {Object.entries(NODES).map(([n, m]) => { const st = seen.get(n), Icon = m.icon, off = m.kind === 'decoy' && !decoys[n];
            return <g key={n} transform={`translate(${m.x} ${m.y})`} tabIndex={0} role="button" aria-label={`${n}, ${m.kind}${off ? ', disabled' : ''}`} aria-pressed={sel === n}
              className={`nl-n ${m.kind} ${off ? 'off' : ''} ${sel === n ? 'sel' : ''} ${cur?.node === n ? 'cur' : ''} ${st ? st.kind : ''}`}
              onClick={() => { if (!suppress.current) setSel(n); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(n); } }}>
              {(st?.kind === 'detect') && <circle r="38" className="nl-halo" filter="url(#nlglow)" />}
              <circle r="30" className="nl-c" />
              <Icon x={-12} y={-12} size={24} />
              <text y="52">{n}</text>
            </g>; })}
        </g>
      </svg>
      <div className="nl-zoom"><button aria-label="Zoom in" onClick={() => zoom(1.25)}><Plus size={15} /></button><button aria-label="Zoom out" onClick={() => zoom(0.8)}><Minus size={15} /></button><button aria-label="Reset view" onClick={() => setV({ x: 0, y: 0, k: 1 })}><Maximize2 size={14} /></button></div>
      <div className="nl-legend"><span><i className="legend-dot real" /> Production</span><span><i className="legend-dot decoy" /> Decoy</span><span><i className="legend-dot path" /> Attack path</span><span>{Math.round(v.k * 100)}%</span></div>
    </div>
    <div className="nl-replay" role="group" aria-label="Replay controls">
      <button className="icon-btn small" aria-label="Previous step" onClick={() => go(step - 1)} disabled={step < 0}><SkipBack size={15} /></button>
      <button className="btn primary nl-play" onClick={toggle} disabled={running}>{playing ? <><Pause size={14} /> Pause</> : <><Play size={14} fill="currentColor" /> Replay</>}</button>
      <button className="icon-btn small" aria-label="Next step" onClick={() => go(step + 1)} disabled={step >= frames.length - 1}><SkipForward size={15} /></button>
      <input type="range" min={0} max={frames.length} value={step + 1} onChange={e => go(Number(e.target.value) - 1)} aria-label="Replay position" disabled={running} />
      <span className="nl-pos">{step + 1}/{frames.length}</span>
    </div>
    <div className="nl-info">
      <ol className="nl-steps" aria-label="Attack steps">{frames.map((f, i) => <li key={i}><button className={`${i === step ? 'on' : ''} ${i < step ? 'past' : ''}`} onClick={() => go(i)} disabled={running}><b>{i + 1}</b><span>{f.node ?? 'Outcome'}<small>{f.title}</small></span><em className={`severity ${f.sev.toLowerCase()}`}>{f.sev}</em></button></li>)}</ol>
      <aside className="nl-detail" aria-live="polite">{selMeta && sel ? <>
        <div className="nl-dh"><div className={`asset-icon nl-k-${selMeta.kind}`}><selMeta.icon size={17} /></div><div><b>{sel}</b><small>{selMeta.kind === 'decoy' ? 'Deception asset' : selMeta.kind === 'external' ? 'External' : 'Production asset'}</small></div><button className="icon-btn small" aria-label="Focus node" onClick={() => focus(sel)}><Crosshair size={14} /></button></div>
        <dl><dt>Address</dt><dd>{selMeta.ip}</dd><dt>System</dt><dd>{selMeta.os}</dd><dt>Role</dt><dd>{selMeta.role}</dd><dt>Services</dt><dd>{selMeta.svc}</dd><dt>Criticality</dt><dd>{selMeta.crit}</dd><dt>This run</dt><dd>{selFrame ? `${selFrame.title} (step ${frames.indexOf(selFrame) + 1})` : 'Not reached yet'}</dd></dl>
        {selMeta.kind === 'decoy' && <div className="nl-tog"><span>{decoys[sel] ? 'Decoy enabled' : 'Decoy disabled'}</span><button className={`switch ${decoys[sel] ? 'on' : ''}`} role="switch" aria-checked={decoys[sel]} aria-label={`Toggle ${sel}`} onClick={() => p.onToggle(sel)} disabled={running}><span /></button></div>}
        {selMeta.note && <p className="nl-note">{selMeta.note}</p>}
        <div className="nl-nb">{nbrs.map(n => <button key={n} onClick={() => setSel(n)}>{n}</button>)}</div>
      </> : <div className="nl-empty"><Crosshair size={20} /><b>Select a node</b><p>Inspect addresses, roles and connections, or toggle a decoy directly from the map.</p></div>}</aside>
    </div>
  </div>;
}

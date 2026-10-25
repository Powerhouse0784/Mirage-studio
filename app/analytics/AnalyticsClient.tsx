'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, CalendarDays, ChartLine, Download, Filter, RefreshCw, ShieldCheck, ShieldAlert, Target, Waypoints } from 'lucide-react';

type Run = { id: string; investigationId: string | null; scenario: string; detected: boolean; enabledDecoys: number; eventCount: number; completedAt: string };
type Payload = { runs: Run[]; truncated: boolean };
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const sinceDays = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return dateKey(d); };
const pct = (n: number, total: number) => total ? Math.round(n / total * 100) : 0;

export default function AnalyticsClient({ userName }: { userName: string }) {
  const [start, setStart] = useState(sinceDays(29));
  const [end, setEnd] = useState(dateKey(new Date()));
  const [scenario, setScenario] = useState('all');
  const [payload, setPayload] = useState<Payload>({ runs: [], truncated: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ start, end, scenario });
      const response = await fetch(`/api/analytics?${params}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load analytics.');
      setPayload(data as Payload);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load analytics.'); }
    finally { setLoading(false); }
  }, [start, end, scenario]);
  useEffect(() => { void load(); }, [load]);

  const runs = payload.runs;
  const scenarios = useMemo(() => ['Web exploit', 'Phished insider', 'Stolen credentials', 'Ransomware probe', ...runs.map(r => r.scenario)].filter((name, index, all) => all.indexOf(name) === index).sort(), [runs]);
  const detected = runs.filter(r => r.detected).length;
  const gaps = runs.length - detected;
  const avgDecoys = runs.length ? runs.reduce((sum, r) => sum + r.enabledDecoys, 0) / runs.length : 0;
  const avgEvents = runs.length ? Math.round(runs.reduce((sum, r) => sum + r.eventCount, 0) / runs.length) : 0;
  const byScenario = useMemo(() => scenarios.map(name => {
    const subset = runs.filter(r => r.scenario === name);
    const hits = subset.filter(r => r.detected).length;
    const decoys = subset.reduce((sum, r) => sum + r.enabledDecoys, 0);
    return { name, total: subset.length, hits, rate: pct(hits, subset.length), decoys: subset.length ? decoys / subset.length : 0 };
  }).sort((a, b) => b.total - a.total), [runs, scenarios]);
  const days = useMemo(() => {
    const result: { key: string; label: string; total: number; hits: number }[] = [];
    if (!start || !end) return result;
    const cursor = new Date(`${start}T12:00:00`);
    const last = new Date(`${end}T12:00:00`);
    let guard = 0;
    while (cursor <= last && guard < 93) {
      const key = dateKey(cursor);
      const daily = runs.filter(r => dateKey(new Date(r.completedAt)) === key);
      result.push({ key, label: cursor.toLocaleDateString('en', { month: 'short', day: 'numeric' }), total: daily.length, hits: daily.filter(r => r.detected).length });
      cursor.setDate(cursor.getDate() + 1); guard++;
    }
    return result;
  }, [runs, start, end]);
  const maxDaily = Math.max(1, ...days.map(d => d.total));

  function exportCsv() {
    const headers = ['completed_at', 'scenario', 'detected', 'enabled_decoys', 'event_count', 'investigation_id', 'run_id'];
    const rows = runs.map(r => [r.completedAt, r.scenario, r.detected ? 'yes' : 'no', r.enabledDecoys, r.eventCount, r.investigationId ?? '', r.id]);
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `mirage-analytics-${start}-to-${end}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return <main className="analytics-app">
    <header className="analytics-topbar"><Link href="/" className="analytics-back"><ArrowLeft size={16}/> Back to Lab</Link><div className="analytics-brand"><span className="analytics-brand-mark"><Activity size={18}/></span><span><b>MIRAGE<span>.</span></b><small>INVESTIGATION INTELLIGENCE</small></span></div><div className="analytics-user">Analyst · {userName}</div></header>
    <div className="analytics-page-wrap">
      <div className="analytics-hero"><div><div className="analytics-eyebrow"><span/> SECURITY OPERATIONS / ANALYTICS</div><h1>Investigation intelligence<span>.</span></h1><p>Compare scenario outcomes, inspect detection gaps, and export the saved evidence behind your analysis.</p></div><button className="analytics-export" onClick={exportCsv} disabled={loading || !runs.length}><Download size={16}/> Export CSV</button></div>
      <section className="analytics-filters" aria-label="Analytics filters"><div className="analytics-filter-heading"><Filter size={16}/><b>Report filters</b><span>Changes apply to all charts</span></div><label>From<input type="date" value={start} max={end} onChange={e=>setStart(e.target.value)}/></label><label>To<input type="date" value={end} min={start} onChange={e=>setEnd(e.target.value)}/></label><label>Scenario<select value={scenario} onChange={e=>setScenario(e.target.value)}><option value="all">All scenarios</option>{scenarios.map(name=><option key={name} value={name}>{name}</option>)}</select></label><button className="analytics-refresh" onClick={()=>void load()} disabled={loading}><RefreshCw size={15} className={loading?'analytics-spin':''}/>{loading?'Loading':'Refresh'}</button></section>
      {error && <div className="analytics-error" role="alert">{error} <button onClick={()=>void load()}>Try again</button></div>}
      {payload.truncated && <p className="analytics-notice">Showing the latest 1,000 matching runs. Narrow the date range for a complete export of a smaller period.</p>}
      <section className="analytics-kpis" aria-label="Summary metrics">
        <article className="analytics-kpi"><span className="analytics-kpi-icon purple"><Activity size={18}/></span><small>COMPLETED RUNS</small><strong>{loading?'—':runs.length.toLocaleString()}</strong><span>Within selected period</span></article>
        <article className="analytics-kpi"><span className="analytics-kpi-icon mint"><ShieldCheck size={18}/></span><small>DETECTION RATE</small><strong>{loading?'—':`${pct(detected,runs.length)}%`}</strong><span>{detected} detected outcomes</span></article>
        <article className="analytics-kpi"><span className="analytics-kpi-icon amber"><ShieldAlert size={18}/></span><small>DETECTION GAPS</small><strong>{loading?'—':gaps}</strong><span>Runs without a detection</span></article>
        <article className="analytics-kpi"><span className="analytics-kpi-icon blue"><Waypoints size={18}/></span><small>AVERAGE DECOYS</small><strong>{loading?'—':avgDecoys.toFixed(1)}<em> / 5</em></strong><span>{avgEvents} avg. events per run</span></article>
      </section>
      <section className="analytics-main-grid">
        <article className="analytics-card analytics-trend-card"><div className="analytics-card-head"><div><h2><ChartLine size={18}/> Detection trend</h2><p>Run volume and detected outcomes by day</p></div><span className="analytics-legend"><i/> Total runs <i className="legend-mint"/> Detected</span></div>
          {loading ? <div className="analytics-loading">Loading saved runs…</div> : runs.length ? <div className="analytics-trend" role="img" aria-label="Daily simulation volume and detections">{days.map(day=><div className="analytics-trend-day" key={day.key} title={`${day.key}: ${day.total} runs, ${day.hits} detected`}><div className="analytics-trend-bars"><span className="analytics-bar-total" style={{height:`${day.total ? Math.max(5, day.total/maxDaily*100) : 2}%`}}/><span className="analytics-bar-hit" style={{height:`${day.hits ? Math.max(5, day.hits/maxDaily*100) : 2}%`}}/></div><small>{day.label}</small></div>)}</div> : <div className="analytics-empty-state"><CalendarDays size={24}/><b>No runs in this period</b><p>Complete a lab simulation or widen the date range to see trends.</p></div>}
        </article>
        <article className="analytics-card"><div className="analytics-card-head"><div><h2><Target size={18}/> Scenario comparison</h2><p>Compare detection outcomes by scenario</p></div></div>
          {loading ? <div className="analytics-loading">Calculating comparison…</div> : byScenario.length ? <div className="analytics-scenario-list">{byScenario.map(item=><div className="analytics-scenario-row" key={item.name}><div className="analytics-scenario-top"><b>{item.name}</b><span>{item.rate}% <small>detection</small></span></div><div className="analytics-track"><i style={{width:`${item.rate}%`}}/></div><div className="analytics-scenario-meta"><span>{item.hits}/{item.total} detected</span><span>{item.decoys.toFixed(1)} avg decoys</span></div></div>)}</div> : <div className="analytics-empty-state compact"><Target size={22}/><p>Scenario comparisons appear after your first saved run.</p></div>}
        </article>
      </section>
      <section className="analytics-card analytics-decoy-card"><div className="analytics-card-head"><div><h2><Waypoints size={18}/> Decoy effectiveness overview</h2><p>Observed outcomes grouped by how many decoys were enabled</p></div></div>
        {loading ? <div className="analytics-loading">Analyzing decoy outcomes…</div> : runs.length ? <div className="analytics-decoy-grid">{[0,1,2,3,4,5].map(count=>{const subset=runs.filter(r=>r.enabledDecoys===count);const rate=pct(subset.filter(r=>r.detected).length,subset.length);return <div className="analytics-decoy-item" key={count}><div className="analytics-decoy-number">{count}<small> / 5</small></div><div className="analytics-decoy-track"><i style={{width:`${rate}%`}}/></div><b>{subset.length?`${rate}%`:'—'}</b><span>{subset.length} {subset.length===1?'run':'runs'}</span></div>})}</div> : <div className="analytics-empty-state compact"><Waypoints size={22}/><p>Decoy effectiveness will be calculated from your saved simulation outcomes.</p></div>}
        <p className="analytics-disclaimer">This is observational simulation data, not proof of real-world security effectiveness. Results can be affected by scenario mix and sample size.</p>
      </section>
      <section className="analytics-card analytics-table-card"><div className="analytics-card-head"><div><h2><CalendarDays size={18}/> Run-level evidence</h2><p>Newest matching simulation records first</p></div><span className="analytics-record-count">{loading?'…':runs.length} records</span></div>
        {loading ? <div className="analytics-loading">Loading records…</div> : runs.length ? <div className="analytics-table-scroll"><table className="analytics-table"><thead><tr><th>Completed</th><th>Scenario</th><th>Outcome</th><th>Decoys</th><th>Events</th><th>Run ID</th></tr></thead><tbody>{runs.slice(0,100).map(run=><tr key={run.id}><td>{new Date(run.completedAt).toLocaleString()}</td><td>{run.scenario}</td><td><span className={`analytics-outcome ${run.detected?'good':'gap'}`}>{run.detected?'Detected':'Gap'}</span></td><td>{run.enabledDecoys}/5</td><td>{run.eventCount}</td><td><code title={run.id}>{run.id.slice(0,10)}…</code></td></tr>)}</tbody></table>{runs.length>100&&<p className="analytics-disclaimer">Showing the newest 100 rows on screen. CSV export includes all {runs.length} matching records.</p>}</div> : <div className="analytics-empty-state"><Activity size={24}/><b>No saved records yet</b><p>Go back to the Lab and complete a simulation. This report never invents sample runs.</p><Link href="/" className="analytics-link-button">Open the Lab</Link></div>}
      </section>
      <footer className="analytics-footer">MIRAGE Studio · Private account analytics · Simulation-only evidence</footer>
    </div>
  </main>;
}

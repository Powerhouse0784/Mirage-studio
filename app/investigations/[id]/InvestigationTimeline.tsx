'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, FileText, Filter, LoaderCircle, MessageSquare, PlayCircle, RefreshCw, Search, ShieldAlert } from 'lucide-react';

type TimelineItem = { id: string; type: string; title: string; detail: string; severity: string; actor: string; at: string; meta: string };
const typeLabels: Record<string, string> = { ALL: 'All activity', EVENT: 'Audit events', SIMULATION: 'Simulations', EVIDENCE: 'Evidence', CASE_ACTIVITY: 'Case updates', COMMENT: 'Comments' };
const icons: Record<string, typeof Activity> = { EVENT: ShieldAlert, SIMULATION: PlayCircle, EVIDENCE: FileText, CASE_ACTIVITY: Activity, COMMENT: MessageSquare };

export default function InvestigationTimeline({ id }: { id: string }) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [search, setSearch] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/investigations/${id}/timeline`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load the investigation timeline.');
      setItems(data.items);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load the investigation timeline.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void refresh(); }, [refresh]);
  const visible = useMemo(() => items.filter(item => (type === 'ALL' || item.type === type) && (severity === 'ALL' || item.severity.toUpperCase() === severity) && `${item.title} ${item.detail} ${item.actor} ${item.meta}`.toLowerCase().includes(search.toLowerCase())), [items, type, severity, search]);
  const gaps = items.filter(item => item.type === 'SIMULATION' && item.meta === 'Detection gap').length;
  return <section className="report-panel timeline-panel">
    <div className="report-panel-title"><CalendarClock size={18}/><div><h2>Investigation timeline</h2><p>A unified, newest-first story across audit events, simulations, evidence, case updates, and analyst comments</p></div><button type="button" className="timeline-refresh" onClick={() => void refresh()} disabled={loading} title="Refresh timeline"><RefreshCw size={14}/></button></div>
    <div className="timeline-summary"><span><Activity size={14}/><b>{items.length}</b> records</span><span><CheckCircle2 size={14}/><b>{items.filter(item => item.type === 'SIMULATION' && item.meta === 'Detected').length}</b> detected runs</span><span className={gaps ? 'timeline-gap' : ''}><AlertTriangle size={14}/><b>{gaps}</b> detection gaps</span></div>
    <div className="timeline-filters"><label className="alert-search"><Search size={15}/><input aria-label="Search timeline" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activity, details, analyst…"/></label><label className="timeline-select"><Filter size={14}/><select aria-label="Filter timeline by type" value={type} onChange={e => setType(e.target.value)}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><select aria-label="Filter timeline by severity" value={severity} onChange={e => setSeverity(e.target.value)}><option value="ALL">All severities</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option><option value="INFO">Info</option></select><span className="timeline-result-count">{visible.length} shown</span></div>
    {error && <div className="evidence-feedback error">{error} <button type="button" onClick={() => void refresh()}>Retry</button></div>}
    {loading ? <div className="report-empty"><LoaderCircle size={18}/> Loading timeline…</div> : visible.length ? <div className="timeline-list">{visible.map(item => { const Icon = icons[item.type] || Activity; return <article className="timeline-item" key={item.id}><div className={`timeline-icon timeline-icon-${item.type.toLowerCase()}`}><Icon size={15}/></div><div className="timeline-item-body"><div className="timeline-item-heading"><b>{item.title}</b><span className={`timeline-severity timeline-severity-${item.severity.toLowerCase()}`}>{item.severity}</span></div><p>{item.detail}</p><div className="timeline-item-meta"><span>{item.actor}</span><span>{new Date(item.at).toLocaleString()}</span><span>{item.meta}</span></div>{item.detail.length > 240 && <details className="timeline-details"><summary>Read full details</summary><p>{item.detail}</p></details>}</div></article>; })}</div> : <div className="report-empty"><Activity size={20}/><b>{items.length ? 'No matching activity' : 'No timeline activity yet'}</b><span>{items.length ? 'Change the filters or search phrase to see more records.' : 'Run a simulation, record evidence, or update the case to start building its timeline.'}</span></div>}
    <p className="timeline-note">Timeline records are combined from the case’s saved sources. The view is for investigation review; it does not represent live monitoring.</p>
  </section>;
}

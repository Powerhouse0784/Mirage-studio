'use client';

import { useMemo, useState } from 'react';
import { Check, CircleAlert, Search, Save, Workflow } from 'lucide-react';

type CaseStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
type EvidenceEvent = { id: string; seq: number; title: string; detail: string; severity: string; node: string | null; occurredAt: string };

const statusLabels: Record<CaseStatus, string> = { OPEN: 'Open', IN_REVIEW: 'In review', RESOLVED: 'Resolved' };

export default function InvestigationWorkflow({ id, initialStatus, initialNotes, events }: { id: string; initialStatus: CaseStatus; initialNotes: string; events: EvidenceEvent[] }) {
  const [status, setStatus] = useState<CaseStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(e => [e.title, e.detail, e.severity, e.node ?? '', String(e.seq)].some(v => v.toLowerCase().includes(q)));
  }, [events, query]);

  async function saveWorkflow() {
    setSaving(true); setMessage(''); setError('');
    try {
      const response = await fetch(`/api/investigations/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, analystNotes: notes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not save case changes.');
      setMessage('Case workflow saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save case changes.');
    } finally { setSaving(false); }
  }

  return <>
    <section className="report-panel workflow-panel">
      <div className="report-panel-title"><Workflow size={17}/><div><h2>Case workflow</h2><p>Track review progress and keep analyst notes with this investigation.</p></div></div>
      <div className="workflow-fields">
        <label className="workflow-field"><span>CASE STATUS</span><select value={status} onChange={e => setStatus(e.target.value as CaseStatus)}><option value="OPEN">Open</option><option value="IN_REVIEW">In review</option><option value="RESOLVED">Resolved</option></select></label>
        <label className="workflow-field workflow-notes"><span>ANALYST NOTES <small>{notes.length}/10000</small></span><textarea maxLength={10000} rows={5} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Record findings, hypotheses, next steps, or resolution details…" /></label>
      </div>
      <div className="workflow-save-row"><span className={`case-status-pill status-${status.toLowerCase()}`}>{statusLabels[status]}</span><button className="report-action primary" onClick={saveWorkflow} disabled={saving}><Save size={14}/>{saving ? 'Saving…' : 'Save workflow'}</button>{message && <span className="workflow-success"><Check size={14}/>{message}</span>}{error && <span className="workflow-error"><CircleAlert size={14}/>{error}</span>}</div>
    </section>
    <section className="report-panel report-events-panel">
      <div className="report-panel-title"><Search size={17}/><div><h2>Search evidence timeline</h2><p>Search the latest {events.length} loaded audit events by title, details, severity, node, or sequence number.</p></div></div>
      <div className="evidence-search"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search evidence… e.g. CRITICAL, decoy, #12"/><span>{filteredEvents.length} / {events.length}</span></div>
      {filteredEvents.length ? <div className="report-event-list">{filteredEvents.map(e => <article className="report-event" key={e.id}><div className={`report-event-marker sev-${e.severity.toLowerCase()}`}/><div className="report-event-main"><div><b>{e.title}</b><span className={`report-severity sev-${e.severity.toLowerCase()}`}>{e.severity}</span></div><p>{e.detail}</p><small>{new Date(e.occurredAt).toLocaleString()}{e.node ? ` · ${e.node}` : ''} · Sequence #{e.seq}</small></div></article>)}</div> : <div className="report-empty">{events.length ? 'No evidence matches that search. Try another term.' : 'No evidence events have been recorded.'}</div>}
    </section>
  </>;
}

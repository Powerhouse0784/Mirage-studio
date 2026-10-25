'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight, CheckCircle2, Clock3, Search, ShieldAlert, Siren } from 'lucide-react';

export type AlertRow = { id:string; investigationId:string; investigationTitle:string; seq:number; title:string; detail:string; severity:string; node:string|null; occurredAt:string; caseStatus:string; casePriority:string };
const levels = ['CRITICAL','HIGH','MEDIUM','LOW'];
const formatDate = (value:string) => new Date(value).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
export default function AlertsClient({alerts}:{alerts:AlertRow[]}) {
  const [query,setQuery] = useState('');
  const [severity,setSeverity] = useState('ALL');
  const [status,setStatus] = useState('ALL');
  const [caseFilter,setCaseFilter] = useState('ALL');
  const counts = useMemo(()=>({critical:alerts.filter(a=>a.severity==='CRITICAL').length,high:alerts.filter(a=>a.severity==='HIGH').length,medium:alerts.filter(a=>a.severity==='MEDIUM').length,low:alerts.filter(a=>a.severity==='LOW').length,open:alerts.filter(a=>a.caseStatus==='OPEN').length}),[alerts]);
  const filtered = useMemo(()=>alerts.filter(a=>{
    const q=query.trim().toLowerCase();
    const textMatch=!q||[a.title,a.detail,a.node,a.investigationTitle,a.severity].some(v=>String(v??'').toLowerCase().includes(q));
    return textMatch&&(severity==='ALL'||a.severity===severity)&&(status==='ALL'||a.caseStatus===status)&&(caseFilter==='ALL'||a.casePriority===caseFilter);
  }),[alerts,query,severity,status,caseFilter]);
  return <>
    <section className="report-kpis alert-kpis">
      <article><span><Siren size={17}/></span><small>CRITICAL</small><strong>{counts.critical}</strong><p>Immediate review recommended</p></article>
      <article><span><ShieldAlert size={17}/></span><small>HIGH SEVERITY</small><strong>{counts.high}</strong><p>High-risk simulation signals</p></article>
      <article><span><Activity size={17}/></span><small>MEDIUM / LOW</small><strong>{counts.medium+counts.low}</strong><p>Lower-severity activity</p></article>
      <article><span><Clock3 size={17}/></span><small>OPEN CASES</small><strong>{counts.open}</strong><p>Cases still requiring triage</p></article>
    </section>
    <section className="report-panel alert-queue-panel">
      <div className="report-panel-title"><ShieldAlert size={17}/><div><h2>Alert queue</h2><p>{filtered.length} of {alerts.length} recorded events · newest first</p></div></div>
      <div className="alert-filters"><label className="alert-search"><Search size={16}/><input aria-label="Search alerts" placeholder="Search alert, case, asset…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Filter severity" value={severity} onChange={e=>setSeverity(e.target.value)}><option value="ALL">All severities</option>{levels.map(level=><option key={level} value={level}>{level}</option>)}</select><select aria-label="Filter case status" value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">All case statuses</option><option value="OPEN">Open</option><option value="IN_REVIEW">In review</option><option value="RESOLVED">Resolved</option></select><select aria-label="Filter case priority" value={caseFilter} onChange={e=>setCaseFilter(e.target.value)}><option value="ALL">All case priorities</option>{levels.map(level=><option key={level} value={level}>{level} priority</option>)}</select></div>
      {filtered.length ? <div className="alert-queue">{filtered.map(alert=><article className="alert-row" key={alert.id}><span className={`alert-severity-dot severity-${alert.severity.toLowerCase()}`} aria-hidden="true"/><div className="alert-main"><div className="alert-title-line"><b>{alert.title}</b><span className={`case-priority priority-${alert.severity.toLowerCase()}`}>{alert.severity}</span></div><p>{alert.detail}</p><div className="alert-meta"><span><Clock3 size={12}/>{formatDate(alert.occurredAt)}</span>{alert.node&&<span><Activity size={12}/>{alert.node}</span>}<span>Event #{alert.seq}</span></div><div className="alert-case-ref">Case: <b>{alert.investigationTitle}</b><span className={`case-status-pill status-${alert.caseStatus.toLowerCase()}`}>{alert.caseStatus==='IN_REVIEW'?'In review':alert.caseStatus==='RESOLVED'?'Resolved':'Open'}</span></div></div><Link className="alert-open-link" href={`/investigations/${alert.investigationId}`} aria-label={`Open case ${alert.investigationTitle}`}>Open case <ArrowUpRight size={14}/></Link></article>)}</div> : <div className="report-empty"><CheckCircle2 size={22}/><b>No matching alerts</b><span>Try changing the search or filters. New alerts appear when you run a simulation.</span></div>}
    </section>
  </>;
}

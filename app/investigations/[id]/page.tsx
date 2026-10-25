import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Activity, ArrowLeft, BadgeCheck, CalendarClock, Fingerprint, ShieldAlert, ShieldCheck, Waypoints } from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { findOwned, verifyInvestigation } from '@/lib/investigations';
import ReportActions from './ReportActions';
import InvestigationWorkflow from './InvestigationWorkflow';
import CaseCollaboration from './CaseCollaboration';

export const dynamic = 'force-dynamic';

export default async function InvestigationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const investigation = await findOwned(user.id, id);
  if (!investigation) notFound();
  const [events, runs, chain] = await Promise.all([
    db.investigationEvent.findMany({ where: { investigationId: id }, orderBy: { seq: 'desc' }, take: 100 }),
    db.simulationRun.findMany({ where: { userId: user.id, investigationId: id }, orderBy: { completedAt: 'desc' }, take: 100 }),
    verifyInvestigation(id).catch(() => ({ ok: false, reason: 'Audit chain could not be verified.' })),
  ]);
  const detected = runs.filter(r => r.detected).length;
  const rate = runs.length ? Math.round(detected / runs.length * 100) : 0;
  const enabledDecoys = Object.entries((investigation.decoys ?? {}) as Record<string, boolean>).filter(([, enabled]) => enabled).map(([name]) => name);
  const eventDTO = events.map(e => ({ id: e.id, seq: e.seq, title: e.title, detail: e.detail, severity: e.severity, node: e.node, occurredAt: e.occurredAt.toISOString() }));
  const runDTO = runs.map(r => ({ id: r.id, scenario: r.scenario, detected: r.detected, enabledDecoys: r.enabledDecoys, eventCount: r.eventCount, completedAt: r.completedAt.toISOString() }));
  return <main className="investigation-report-page">
    <header className="investigation-report-top"><Link href="/" className="report-back"><ArrowLeft size={16}/> Back to workspace</Link><div className="report-brand"><span className="report-brand-icon"><Fingerprint size={18}/></span><span><b>MIRAGE<span>.</span></b><small>INVESTIGATION WORKSPACE</small></span></div><Link href="/investigations/compare" className="report-back">Compare investigations <Activity size={15}/></Link></header>
    <div className="investigation-report-wrap">
      <div className="report-hero"><div><div className="report-eyebrow"><span/> PRIVATE WORKSPACE / CASE FILE</div><h1>{investigation.title}</h1><p>{investigation.scenario} · Created {investigation.createdAt.toLocaleDateString()} · Updated {investigation.updatedAt.toLocaleString()}</p></div><div className="report-risk"><small>RISK SCORE</small><strong>{investigation.riskScore}<em>/100</em></strong><span className={investigation.riskScore >= 70 ? 'risk-high' : investigation.riskScore >= 35 ? 'risk-mid' : 'risk-low'}>{investigation.riskScore >= 70 ? 'Elevated' : investigation.riskScore >= 35 ? 'Moderate' : 'Low'}</span></div></div>
      <div className="report-case-status"><span className={`case-status-pill status-${investigation.status.toLowerCase()}`}>{investigation.status === 'IN_REVIEW' ? 'In review' : investigation.status === 'RESOLVED' ? 'Resolved' : 'Open'}</span><span>Case status</span><span className={`case-priority priority-${investigation.priority.toLowerCase()}`}>{investigation.priority} priority</span>{investigation.status !== 'RESOLVED' && Date.now() - investigation.updatedAt.getTime() > 7 * 24 * 60 * 60 * 1000 && <span className="case-priority priority-high">Review overdue · 7d+</span>}</div><ReportActions title={investigation.title} scenario={investigation.scenario} events={eventDTO} runs={runDTO}/>
      <section className="report-kpis"><article><span><Activity size={17}/></span><small>SIMULATION RUNS</small><strong>{runs.length}</strong><p>Saved to this investigation</p></article><article><span><ShieldCheck size={17}/></span><small>DETECTED</small><strong>{detected}</strong><p>{rate}% detection rate</p></article><article><span><ShieldAlert size={17}/></span><small>DETECTION GAPS</small><strong>{runs.length - detected}</strong><p>Runs without detection</p></article><article><span><CalendarClock size={17}/></span><small>AUDIT EVENTS</small><strong>{investigation.eventCount}</strong><p>{events.length} most recent shown</p></article></section>
      <section className="report-two-col"><article className="report-panel"><div className="report-panel-title"><Waypoints size={17}/><div><h2>Evidence summary</h2><p>Recorded activity and configured deception assets</p></div></div><div className="evidence-summary-grid"><div><small>Scenario</small><b>{investigation.scenario}</b></div><div><small>Simulation speed</small><b>{investigation.speed}</b></div><div><small>Configured decoys</small><b>{enabledDecoys.length} enabled</b></div><div><small>Audit trail</small><b>{chain.ok ? 'Integrity verified' : 'Verification needs review'}</b></div></div><div className="decoy-chip-list">{enabledDecoys.length ? enabledDecoys.map(name => <span key={name}><BadgeCheck size={13}/>{name}</span>) : <p>No decoys are currently enabled in this investigation configuration.</p>}</div><div className={`audit-integrity ${chain.ok ? 'good' : 'warn'}`}><Fingerprint size={16}/><div><b>{chain.ok ? 'Audit chain verified' : 'Audit chain could not be verified'}</b><p>{chain.ok ? 'The stored event chain passed the available integrity check.' : ('reason' in chain ? chain.reason : 'Review the audit records before relying on this report.')}</p></div></div></article>
        <article className="report-panel"><div className="report-panel-title"><Activity size={17}/><div><h2>Outcome distribution</h2><p>Based on saved runs linked to this investigation</p></div></div><div className="outcome-bar"><span style={{ width: `${rate}%` }}/></div><div className="outcome-bar-labels"><span>Detection rate <b>{rate}%</b></span><span>{runs.length} total runs</span></div>{runs.length ? <div className="report-outcome-legend"><span><i className="good-dot"/> {detected} detected</span><span><i className="gap-dot"/> {runs.length - detected} gaps</span></div> : <div className="report-empty">No saved simulations are linked to this investigation yet. Run a lab simulation to build the report.</div>}</article></section>
      <InvestigationWorkflow id={investigation.id} initialStatus={investigation.status as 'OPEN' | 'IN_REVIEW' | 'RESOLVED'} initialNotes={investigation.analystNotes} events={eventDTO}/>
      <CaseCollaboration id={investigation.id}/>
      <section className="report-panel report-events-panel"><div className="report-panel-title"><Activity size={17}/><div><h2>Simulation history</h2><p>Saved outcomes attached to this case</p></div></div>{runs.length ? <div className="report-table-scroll"><table className="report-table"><thead><tr><th>Completed</th><th>Scenario</th><th>Outcome</th><th>Decoys</th><th>Events</th></tr></thead><tbody>{runs.map(r=><tr key={r.id}><td>{r.completedAt.toLocaleString()}</td><td>{r.scenario}</td><td><span className={`report-outcome ${r.detected?'detected':'gap'}`}>{r.detected?'Detected':'Detection gap'}</span></td><td>{r.enabledDecoys}</td><td>{r.eventCount}</td></tr>)}</tbody></table></div> : <div className="report-empty">No completed simulation runs are linked to this case yet.</div>}</section>
      <footer className="report-footer">MIRAGE Studio · Confidential workspace report · Generated {new Date().toLocaleString()}</footer>
    </div>
  </main>;
}

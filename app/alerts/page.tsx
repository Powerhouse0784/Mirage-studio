import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, BellRing, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import AlertsClient, { type AlertRow } from './AlertsClient';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const investigations = await db.investigation.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    include: { events: { orderBy: { occurredAt: 'desc' }, take: 100 } },
  });
  const alerts: AlertRow[] = investigations.flatMap((inv) => inv.events.map((event) => ({
    id: `${inv.id}:${event.seq}`,
    investigationId: inv.id,
    investigationTitle: inv.title,
    seq: event.seq,
    title: event.title,
    detail: event.detail,
    severity: event.severity,
    node: event.node,
    occurredAt: event.occurredAt.toISOString(),
    caseStatus: inv.status,
    casePriority: inv.priority,
  }))).sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 500);
  return <main className="investigation-report-page alert-center-page">
    <header className="investigation-report-top"><Link href="/" className="report-back"><ArrowLeft size={16}/> Back to workspace</Link><div className="report-brand"><span className="report-brand-icon"><BellRing size={18}/></span><span><b>MIRAGE<span>.</span></b><small>SOC ALERT CENTER</small></span></div><Link href="/analytics" className="report-back">Analytics <ArrowUpRight size={15}/></Link></header>
    <div className="investigation-report-wrap">
      <div className="report-hero"><div><div className="report-eyebrow"><span/> SECURITY OPERATIONS / ALERT TRIAGE</div><h1>SOC alert center<span className="report-title-dot">.</span></h1><p>One triage queue for signals recorded across your saved simulations. These are lab events, not live production telemetry.</p></div><div className="report-risk"><small>ALERTS LOADED</small><strong>{alerts.length}</strong><span className="risk-low">Latest 500 events</span></div></div>
      <AlertsClient alerts={alerts}/>
      <div className="report-compare-note"><ShieldCheck size={16}/><p><b>Simulation scope.</b> Alerts are generated from MIRAGE investigation event logs. This view does not connect to endpoint, cloud, or network monitoring products, and does not ingest live security events.</p></div>
      <footer className="report-footer">MIRAGE Studio · SOC alert center · Generated {new Date().toLocaleString()}</footer>
    </div>
  </main>;
}

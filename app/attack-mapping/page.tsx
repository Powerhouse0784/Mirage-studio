import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Crosshair, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import AttackMappingClient, { type MappingEvent } from './AttackMappingClient';

export const dynamic = 'force-dynamic';

export default async function AttackMappingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const investigations = await db.investigation.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    include: { events: { orderBy: { occurredAt: 'desc' }, take: 100 } },
  });
  const events: MappingEvent[] = investigations.flatMap((inv) => inv.events.map((event) => ({
    id: `${inv.id}:${event.seq}`,
    investigationId: inv.id,
    investigationTitle: inv.title,
    scenario: inv.scenario,
    seq: event.seq,
    title: event.title,
    detail: event.detail,
    severity: event.severity,
    node: event.node,
    occurredAt: event.occurredAt.toISOString(),
  }))).sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 500);
  const cases = investigations.map((inv) => ({ id: inv.id, title: inv.title, scenario: inv.scenario, eventCount: inv.events.length, status: inv.status }));
  return <main className="investigation-report-page attack-mapping-page">
    <header className="investigation-report-top"><Link href="/" className="report-back"><ArrowLeft size={16}/> Back to workspace</Link><div className="report-brand"><span className="report-brand-icon"><Crosshair size={18}/></span><span><b>MIRAGE<span>.</span></b><small>MITRE ATT&amp;CK MAPPING</small></span></div><Link href="/alerts" className="report-back">SOC alerts <ArrowUpRight size={15}/></Link></header>
    <div className="investigation-report-wrap">
      <div className="report-hero"><div><div className="report-eyebrow"><span/> THREAT BEHAVIOUR / FRAMEWORK ALIGNMENT</div><h1>MITRE ATT&amp;CK mapping<span className="report-title-dot">.</span></h1><p>Explore candidate tactics and techniques associated with your saved simulation scenarios, with event evidence linked back to its case.</p></div><div className="report-risk"><small>EVENTS REVIEWED</small><strong>{events.length}</strong><span className="risk-low">Latest 500 events</span></div></div>
      <AttackMappingClient events={events} cases={cases}/>
      <div className="report-compare-note"><ShieldCheck size={16}/><p><b>Analyst validation required.</b> This is an educational, scenario-based mapping to MITRE ATT&amp;CK Enterprise. A scenario association is not proof that a technique occurred. Validate each mapping against event details and your environment before using it in a real assessment.</p></div>
      <footer className="report-footer">MIRAGE Studio · MITRE ATT&amp;CK learning view · Generated {new Date().toLocaleString()}</footer>
    </div>
  </main>;
}

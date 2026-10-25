import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, SearchCode } from 'lucide-react';
import { getCurrentUser } from '@/lib/session';
import ThreatHuntClient from './ThreatHuntClient';

export const dynamic = 'force-dynamic';

export default async function ThreatHuntingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <main className="investigation-report-page threat-hunt-page">
    <header className="investigation-report-top"><Link href="/" className="report-back"><ArrowLeft size={16}/> Back to workspace</Link><div className="report-brand"><span className="report-brand-icon"><SearchCode size={18}/></span><span><b>MIRAGE<span>.</span></b><small>THREAT HUNT WORKBENCH</small></span></div><Link href="/alerts" className="report-back">SOC alerts <ArrowUpRight size={15}/></Link></header>
    <div className="investigation-report-wrap">
      <div className="report-hero"><div><div className="report-eyebrow"><span/> DETECTION ENGINEERING / HUNT WORKBENCH</div><h1>Threat hunt lab<span className="report-title-dot">.</span></h1><p>Build readable detection hypotheses, test them against synthetic telemetry, and export a draft Sigma-style rule for learning.</p></div><div className="report-risk"><small>SAMPLE EVENTS</small><strong>8</strong><span className="risk-low">Local simulation data</span></div></div>
      <ThreatHuntClient />
      <div className="report-compare-note"><SearchCode size={16}/><p><b>Simulation only.</b> Queries run only against this page's synthetic event examples. Rule output is a draft for education, not a validated production detection. No endpoints, logs, or external systems are queried.</p></div>
      <footer className="report-footer">MIRAGE Studio · Threat hunt lab · Training environment</footer>
    </div>
  </main>;
}

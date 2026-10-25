import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Radar, ShieldCheck } from 'lucide-react';
import { getCurrentUser } from '@/lib/session';
import ThreatIntelClient from './ThreatIntelClient';

export const dynamic = 'force-dynamic';

export default async function ThreatIntelPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <main className="investigation-report-page threat-intel-page">
    <header className="investigation-report-top"><Link href="/" className="report-back"><ArrowLeft size={16}/> Back to workspace</Link><div className="report-brand"><span className="report-brand-icon"><Radar size={18}/></span><span><b>MIRAGE<span>.</span></b><small>INDICATOR EXPLORER</small></span></div><Link href="/alerts" className="report-back">SOC alerts <ArrowUpRight size={15}/></Link></header>
    <div className="investigation-report-wrap">
      <div className="report-hero"><div><div className="report-eyebrow"><span/> THREAT INTELLIGENCE / INDICATOR TRIAGE</div><h1>Indicator explorer<span className="report-title-dot">.</span></h1><p>Search, filter and review example indicators of compromise (IOCs) in a safe, self-contained training catalogue.</p></div><div className="report-risk"><small>TRAINING INDICATORS</small><strong>12</strong><span className="risk-low">Local sample catalogue</span></div></div>
      <ThreatIntelClient />
      <div className="report-compare-note"><ShieldCheck size={16}/><p><b>Training data only.</b> Indicators are synthetic examples for learning and interface testing. MIRAGE does not query external threat feeds, resolve domains, visit URLs, or claim that these indicators are malicious in the real world.</p></div>
      <footer className="report-footer">MIRAGE Studio · Indicator explorer · Generated {new Date().toLocaleString()}</footer>
    </div>
  </main>;
}

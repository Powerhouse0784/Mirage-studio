import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { getCurrentUser } from '@/lib/session';
import DetectionRulesClient from './DetectionRulesClient';
export const dynamic = 'force-dynamic';
export default async function DetectionRulesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <main className="investigation-report-page detection-rules-page"><header className="investigation-report-top"><Link href="/" className="report-back"><ArrowLeft size={16}/> Back to workspace</Link><div className="report-brand"><span className="report-brand-icon"><ShieldCheck size={18}/></span><span><b>MIRAGE<span>.</span></b><small>DETECTION RULE LIBRARY</small></span></div><Link href="/threat-hunting" className="report-back">Threat hunt lab <SlidersHorizontal size={15}/></Link></header><div className="investigation-report-wrap"><div className="report-hero"><div><div className="report-eyebrow"><span/> DETECTION ENGINEERING / RULE MANAGEMENT</div><h1>Detection rules<span className="report-title-dot">.</span></h1><p>Review training rules, map detections to ATT&amp;CK techniques, and export Sigma-style YAML for lab exercises.</p></div><div className="report-risk"><small>BUILT-IN RULES</small><strong>08</strong><span className="risk-low">Local training library</span></div></div><DetectionRulesClient/><div className="report-compare-note"><ShieldCheck size={16}/><p><b>Simulation only.</b> These sample rules are educational drafts, not production-ready detections. Validate field names, log sources, backend compatibility, and false-positive behavior before adapting them to a real SIEM.</p></div><footer className="report-footer">MIRAGE Studio · Detection rule library · Signed-in workspace: {user.workspaceName}</footer></div></main>;
}

'use client';

import { Download, FileJson, FileText, Printer } from 'lucide-react';

type EventRow = { id?: string; seq: number; title: string; detail: string; severity: string; node: string | null; occurredAt: string };
type RunRow = { id: string; scenario: string; detected: boolean; enabledDecoys: number; eventCount: number; completedAt: string };
type EvidenceRow = { id: string; title: string; kind: string; description: string; sourceUrl: string | null; sha256: string; createdBy: string; createdAt: string };
type Props = {
  title: string; scenario: string; status: string; priority: string; riskScore: number; analystNotes: string;
  createdAt: string; updatedAt: string; auditVerified: boolean; events: EventRow[]; runs: RunRow[]; evidence: EvidenceRow[];
};

function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report'; }
function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReportActions(props: Props) {
  const { title, scenario, status, priority, riskScore, analystNotes, createdAt, updatedAt, auditVerified, events, runs, evidence } = props;
  const detected = runs.filter(r => r.detected).length;
  const gaps = runs.length - detected;
  const rate = runs.length ? Math.round(detected / runs.length * 100) : null;
  const severityCounts = events.reduce<Record<string, number>>((all, event) => { const key = event.severity.toUpperCase(); all[key] = (all[key] ?? 0) + 1; return all; }, {});
  const remediation = [
    ...(gaps > 0 ? [`Review ${gaps} simulation run(s) with detection gaps; validate alert coverage and detection logic.`] : []),
    ...(riskScore >= 70 ? ['Prioritize containment planning and senior analyst review due to elevated case risk.'] : riskScore >= 35 ? ['Review medium-risk indicators and confirm containment readiness.'] : ['Maintain current controls and validate the low-risk assessment against available evidence.']),
    ...(evidence.length === 0 ? ['Collect and document supporting evidence before closing the investigation.'] : ['Verify evidence context, source references, and fingerprints before relying on findings.']),
    ...(!auditVerified ? ['Investigate the audit-chain verification warning before treating this report as authoritative.'] : []),
  ];
  const report = {
    product: 'MIRAGE Studio', reportType: 'Investigation Report', schemaVersion: 1, generatedAt: new Date().toISOString(),
    executiveSummary: {
      title, scenario, status, priority, riskScore, riskBand: riskScore >= 70 ? 'Elevated' : riskScore >= 35 ? 'Moderate' : 'Low',
      simulationRuns: runs.length, detectedRuns: detected, detectionGaps: gaps, detectionRatePercent: rate,
      evidenceItems: evidence.length, auditChainVerified: auditVerified,
      summary: runs.length ? `${detected} of ${runs.length} saved simulation runs were detected${rate === null ? '' : ` (${rate}% detection rate)`}; ${gaps} run(s) resulted in detection gaps.` : 'No saved simulation runs are linked to this investigation yet.',
    },
    case: { createdAt, updatedAt, analystNotes },
    technicalFindings: { severityCounts, events: events.map(e => ({ sequence: e.seq, timestamp: e.occurredAt, title: e.title, detail: e.detail, severity: e.severity, node: e.node })), simulationRuns: runs.map(r => ({ ...r, outcome: r.detected ? 'DETECTED' : 'DETECTION_GAP' })) },
    timeline: [...events.map(e => ({ type: 'EVENT', timestamp: e.occurredAt, title: e.title, detail: e.detail, severity: e.severity })), ...runs.map(r => ({ type: 'SIMULATION', timestamp: r.completedAt, title: `${r.scenario} simulation completed`, detail: `${r.detected ? 'Threat detected' : 'Detection gap'}; ${r.enabledDecoys} enabled decoys; ${r.eventCount} events`, severity: r.detected ? 'LOW' : 'HIGH' })), ...evidence.map(e => ({ type: 'EVIDENCE', timestamp: e.createdAt, title: e.title, detail: e.description, severity: 'INFO' }))].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    evidence: evidence.map(e => ({ id: e.id, title: e.title, kind: e.kind, description: e.description, sourceUrl: e.sourceUrl, sha256: e.sha256, createdBy: e.createdBy, createdAt: e.createdAt })),
    remediationRecommendations: remediation,
    disclaimer: 'Training and simulation report. Findings describe saved MIRAGE simulation data and do not establish real-world compromise or production-system status.',
  };

  function csv() {
    const rows = [['section','timestamp','name','detail','severity','outcome','decoys','event_count','node','id']];
    events.forEach(e => rows.push(['event', e.occurredAt, e.title, e.detail, e.severity, '', '', '', e.node ?? '', String(e.seq)]));
    runs.forEach(r => rows.push(['simulation', r.completedAt, r.scenario, '', '', r.detected ? 'detected' : 'gap', String(r.enabledDecoys), String(r.eventCount), '', r.id]));
    evidence.forEach(e => rows.push(['evidence', e.createdAt, e.title, e.description, 'INFO', '', '', '', e.createdBy, e.id]));
    const content = rows.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n');
    download(`mirage-investigation-${slug(title)}.csv`, content, 'text/csv;charset=utf-8');
  }
  function json() { download(`mirage-investigation-${slug(title)}.json`, JSON.stringify(report, null, 2), 'application/json;charset=utf-8'); }

  return <div className="investigation-report-actions"><button type="button" className="report-action secondary" onClick={csv}><Download size={15}/> Export CSV</button><button type="button" className="report-action secondary" onClick={json}><FileJson size={15}/> Export full JSON</button><button type="button" className="report-action primary" onClick={() => window.print()}><Printer size={15}/> Print / Save PDF</button><span><FileText size={14}/> Report: {scenario}</span></div>;
}

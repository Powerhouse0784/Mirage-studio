'use client';

import { Download, FileText, Printer } from 'lucide-react';

type EventRow = { seq: number; title: string; detail: string; severity: string; node: string | null; occurredAt: string };
type RunRow = { id: string; scenario: string; detected: boolean; enabledDecoys: number; eventCount: number; completedAt: string };

export default function ReportActions({ title, scenario, events, runs }: { title: string; scenario: string; events: EventRow[]; runs: RunRow[] }) {
  function csv() {
    const rows = [['section','timestamp','name','detail','severity','outcome','decoys','event_count','node','id']];
    events.forEach(e => rows.push(['evidence', e.occurredAt, e.title, e.detail, e.severity, '', '', '', e.node ?? '', String(e.seq)]));
    runs.forEach(r => rows.push(['simulation', r.completedAt, r.scenario, '', '', r.detected ? 'detected' : 'gap', String(r.enabledDecoys), String(r.eventCount), '', r.id]));
    const content = rows.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `mirage-investigation-${title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'report'}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="investigation-report-actions"><button type="button" className="report-action secondary" onClick={csv}><Download size={15}/> Export evidence CSV</button><button type="button" className="report-action primary" onClick={() => window.print()}><Printer size={15}/> Print / Save PDF</button><span><FileText size={14}/> Report: {scenario}</span></div>;
}

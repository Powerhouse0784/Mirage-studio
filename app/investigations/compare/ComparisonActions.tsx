'use client';

import { Download, FileJson, Printer } from 'lucide-react';

type Row = { id: string; title: string; status: string; scenario: string; updatedAt: string; runs: number; detected: number; gaps: number; rate: number | null; decoys: string; events: number };
export default function ComparisonActions({ rows }: { rows: Row[] }) {
  function save(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function csv() {
    const values = [['investigation_id','title','status','scenario','runs','detected','detection_gaps','detection_rate_percent','average_decoys','events','updated_at'], ...rows.map(r => [r.id,r.title,r.status,r.scenario,r.runs,r.detected,r.gaps,r.rate ?? '',r.decoys,r.events,r.updatedAt])];
    save('mirage-investigation-comparison.csv', values.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }
  function json() { save('mirage-investigation-comparison.json', JSON.stringify({ product: 'MIRAGE Studio', reportType: 'Investigation Comparison', schemaVersion: 1, generatedAt: new Date().toISOString(), definitions: { detectionRate: 'Detected saved runs divided by saved runs; null means no runs.', detectionGap: 'A saved simulation run that was not detected.' }, investigations: rows }, null, 2), 'application/json;charset=utf-8'); }
  return <div className="investigation-report-actions"><button type="button" className="report-action secondary" onClick={csv}><Download size={15}/> Export comparison CSV</button><button type="button" className="report-action secondary" onClick={json}><FileJson size={15}/> Export comparison JSON</button><button type="button" className="report-action primary" onClick={() => window.print()}><Printer size={15}/> Print / Save PDF</button></div>;
}

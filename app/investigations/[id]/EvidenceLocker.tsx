'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clipboard, FileText, Fingerprint, Link2, LoaderCircle, Plus, ShieldCheck, Trash2 } from 'lucide-react';

type Evidence = { id: string; title: string; kind: string; description: string; sourceUrl: string | null; sha256: string; createdAt: string; createdBy: string };
const kinds = ['LOG', 'NOTE', 'URL', 'ARTIFACT', 'SCREENSHOT_REFERENCE'] as const;
const labels: Record<string, string> = { LOG: 'Log excerpt', NOTE: 'Analyst note', URL: 'External reference', ARTIFACT: 'Artifact', SCREENSHOT_REFERENCE: 'Screenshot reference' };

export default function EvidenceLocker({ id }: { id: string }) {
  const [items, setItems] = useState<Evidence[]>([]);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<(typeof kinds)[number]>('LOG');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/investigations/${id}/evidence`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load evidence.');
      setItems(data.evidence);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load evidence.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function addEvidence(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/investigations/${id}/evidence`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, kind, description, sourceUrl: sourceUrl || null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save evidence.');
      setItems(current => [data.evidence, ...current]); setTitle(''); setDescription(''); setSourceUrl(''); setMessage('Evidence recorded and SHA-256 fingerprint calculated.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save evidence.'); }
    finally { setSaving(false); }
  }

  async function removeEvidence(item: Evidence) {
    if (!window.confirm(`Delete evidence record “${item.title}”?`)) return;
    setError(''); setMessage('');
    try {
      const response = await fetch(`/api/investigations/${id}/evidence/${item.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete evidence.');
      setItems(current => current.filter(row => row.id !== item.id)); setMessage('Evidence record deleted.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete evidence.'); }
  }

  const visible = items.filter(item => `${item.title} ${item.description} ${item.kind} ${item.sha256}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="report-panel evidence-locker-panel">
    <div className="report-panel-title"><Fingerprint size={18}/><div><h2>Evidence locker</h2><p>Case-linked evidence records with timestamps and SHA-256 fingerprints</p></div><span className="evidence-count">{items.length} records</span></div>
    <form className="evidence-form" onSubmit={addEvidence}>
      <div className="evidence-form-grid">
        <label className="workflow-field"><span>Evidence title</span><input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Suspicious authentication log" /></label>
        <label className="workflow-field"><span>Evidence type</span><select value={kind} onChange={e => setKind(e.target.value as (typeof kinds)[number])}>{kinds.map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
        <label className="workflow-field evidence-form-wide"><span>Content / analyst notes <small>{description.length}/12000</small></span><textarea required maxLength={12000} value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Paste a relevant log excerpt, observation, or artifact description…" /></label>
        <label className="workflow-field evidence-form-wide"><span>Source URL <small>optional · http(s) only</small></span><input type="url" maxLength={2048} value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://example.com/reference" /></label>
      </div>
      <div className="workflow-save-row"><button className="report-action primary" disabled={saving}><Plus size={14}/>{saving ? 'Recording…' : 'Add evidence record'}</button><span className="evidence-hash-note"><ShieldCheck size={13}/> SHA-256 is calculated from the saved title, type, text, and source URL.</span></div>
    </form>
    {error && <p className="evidence-feedback error">{error}</p>}{message && <p className="evidence-feedback success">{message}</p>}
    <div className="evidence-search"><FileText size={15}/><input aria-label="Search evidence" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search evidence title, notes, or fingerprint…"/><span>{visible.length} shown</span></div>
    {loading ? <div className="report-empty"><LoaderCircle size={18}/> Loading evidence records…</div> : visible.length ? <div className="evidence-record-list">{visible.map(item => <article className="evidence-record" key={item.id}>
      <div className="evidence-record-icon"><FileText size={17}/></div><div className="evidence-record-main"><div className="evidence-record-heading"><b>{item.title}</b><span className="evidence-kind">{labels[item.kind] || item.kind}</span></div><p>{item.description}</p>{item.sourceUrl && <a className="evidence-source" href={item.sourceUrl} target="_blank" rel="noreferrer"><Link2 size={13}/>{item.sourceUrl}</a>}<div className="evidence-fingerprint"><Fingerprint size={13}/><code>{item.sha256}</code><button type="button" title="Copy SHA-256 fingerprint" onClick={() => void navigator.clipboard?.writeText(item.sha256)}><Clipboard size={13}/></button></div><small>Added by {item.createdBy} · {new Date(item.createdAt).toLocaleString()}</small></div><button type="button" className="evidence-delete" title="Delete evidence record" onClick={() => void removeEvidence(item)}><Trash2 size={15}/></button>
    </article>)}</div> : <div className="report-empty"><FileText size={20}/><b>{search ? 'No matching evidence' : 'No evidence recorded yet'}</b><span>{search ? 'Try a different search term.' : 'Add log excerpts, analyst notes, artifact descriptions, or reference URLs above.'}</span></div>}
    <div className="report-compare-note evidence-caveat"><ShieldCheck size={15}/><p><b>Integrity note.</b> The fingerprint helps detect changes to the saved record text; it does not prove that the original source is authentic. This version stores text and references, not uploaded binary files, and deletion is not an immutable chain-of-custody guarantee.</p></div>
  </section>;
}

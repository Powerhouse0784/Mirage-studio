'use client';

import { useMemo, useState } from 'react';
import { Bookmark, Check, Copy, Filter, Search, ShieldAlert, ShieldCheck } from 'lucide-react';

type Indicator = { value: string; type: 'IPv4' | 'Domain' | 'URL' | 'SHA256'; confidence: 'High' | 'Medium' | 'Low'; category: string; note: string; source: string; };
const indicators: Indicator[] = [
  { value: '198.51.100.24', type: 'IPv4', confidence: 'High', category: 'Command and control', note: 'Reserved documentation address used as a simulated beacon destination.', source: 'MIRAGE sample set' },
  { value: '203.0.113.77', type: 'IPv4', confidence: 'Medium', category: 'Scanning', note: 'Reserved documentation address in a simulated reconnaissance event.', source: 'MIRAGE sample set' },
  { value: '192.0.2.41', type: 'IPv4', confidence: 'Low', category: 'Suspicious login', note: 'Documentation-only address used in an authentication scenario.', source: 'MIRAGE sample set' },
  { value: 'login-example.invalid', type: 'Domain', confidence: 'High', category: 'Credential phishing', note: 'Uses the reserved .invalid top-level domain; it cannot represent a live public domain.', source: 'MIRAGE sample set' },
  { value: 'update-check.invalid', type: 'Domain', confidence: 'Medium', category: 'Suspicious download', note: 'Synthetic hostname for safe detection-rule exercises.', source: 'MIRAGE sample set' },
  { value: 'fileshare-lab.invalid', type: 'Domain', confidence: 'Low', category: 'Data staging', note: 'Example hostname for a simulated exfiltration storyline.', source: 'MIRAGE sample set' },
  { value: 'https://login-example.invalid/session', type: 'URL', confidence: 'High', category: 'Credential phishing', note: 'Non-routable example URL. Do not treat as a real threat report.', source: 'MIRAGE sample set' },
  { value: 'https://update-check.invalid/package', type: 'URL', confidence: 'Medium', category: 'Suspicious download', note: 'Synthetic URL used to practice indicator classification.', source: 'MIRAGE sample set' },
  { value: 'a3f1c9d8e7b64520123456789abcdef0123456789abcdef0123456789abcdef0', type: 'SHA256', confidence: 'High', category: 'File reputation', note: 'Illustrative 64-character hash value; no file is available or evaluated.', source: 'MIRAGE sample set' },
  { value: 'b4e2d0c9f8a75631123456789abcdef0123456789abcdef0123456789abcdef1', type: 'SHA256', confidence: 'Medium', category: 'Malware analysis', note: 'Synthetic hash placeholder for enrichment workflow practice.', source: 'MIRAGE sample set' },
  { value: '203.0.113.142', type: 'IPv4', confidence: 'Low', category: 'Unusual outbound traffic', note: 'Reserved documentation address, not a routable threat indicator.', source: 'MIRAGE sample set' },
  { value: 'archive-drop.invalid', type: 'Domain', confidence: 'Medium', category: 'Ransomware probe', note: 'Fictional hostname linked to a ransomware tabletop scenario.', source: 'MIRAGE sample set' },
];
const confidenceClass = (value: string) => `ioc-confidence ioc-confidence-${value.toLowerCase()}`;

export default function ThreatIntelClient() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All types');
  const [confidence, setConfidence] = useState('All confidence');
  const [saved, setSaved] = useState<string[]>([]);
  const [copied, setCopied] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const filtered = useMemo(() => indicators.filter((item) =>
    (type === 'All types' || item.type === type) &&
    (confidence === 'All confidence' || item.confidence === confidence) &&
    (!showSaved || saved.includes(item.value)) &&
    [item.value, item.category, item.note, item.type].some((part) => part.toLowerCase().includes(query.toLowerCase().trim()))
  ), [query, type, confidence, saved, showSaved]);
  async function copyValue(value: string) {
    try { await navigator.clipboard.writeText(value); setCopied(value); window.setTimeout(() => setCopied(''), 1600); }
    catch { setCopied(''); }
  }
  function toggleSaved(value: string) { setSaved((current) => current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]); }
  return <section className="ioc-workspace">
    <div className="ioc-stats">
      <div className="ioc-stat"><span>CATALOGUE SIZE</span><b>{indicators.length}</b><small>synthetic examples</small></div>
      <div className="ioc-stat"><span>HIGH CONFIDENCE</span><b>{indicators.filter(i => i.confidence === 'High').length}</b><small>scenario labels only</small></div>
      <div className="ioc-stat"><span>WATCHLIST</span><b>{saved.length}</b><small>saved in this session</small></div>
    </div>
    <div className="report-panel ioc-panel">
      <div className="report-panel-title"><div><h2>Indicator catalogue</h2><p>Inspect example IOCs and collect a temporary analyst watchlist.</p></div><button className={`ioc-watch-toggle ${showSaved ? 'active' : ''}`} onClick={() => setShowSaved(v => !v)}><Bookmark size={14}/>{showSaved ? 'All indicators' : 'Watchlist'} ({saved.length})</button></div>
      <div className="ioc-filters">
        <label className="ioc-search"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search indicator, category or notes…" aria-label="Search indicators"/></label>
        <label className="ioc-select"><Filter size={14}/><select value={type} onChange={e => setType(e.target.value)} aria-label="Filter by indicator type"><option>All types</option><option>IPv4</option><option>Domain</option><option>URL</option><option>SHA256</option></select></label>
        <select className="ioc-select-plain" value={confidence} onChange={e => setConfidence(e.target.value)} aria-label="Filter by confidence"><option>All confidence</option><option>High</option><option>Medium</option><option>Low</option></select>
      </div>
      <div className="ioc-result-line"><span>{filtered.length} indicators shown</span><button onClick={() => {setQuery('');setType('All types');setConfidence('All confidence');setShowSaved(false);}}>Reset filters</button></div>
      <div className="ioc-list">{filtered.map(item => {
        const isSaved = saved.includes(item.value);
        return <article className="ioc-card" key={item.value}>
          <div className="ioc-card-top"><span className="ioc-type">{item.type}</span><span className={confidenceClass(item.confidence)}>{item.confidence} confidence</span><span className="ioc-category">{item.category}</span></div>
          <code className="ioc-value">{item.value}</code>
          <p>{item.note}</p>
          <div className="ioc-card-bottom"><span>{item.source} · simulated</span><div><button title="Copy indicator" aria-label={`Copy ${item.value}`} onClick={() => copyValue(item.value)}>{copied === item.value ? <Check size={14}/> : <Copy size={14}/>}<span>{copied === item.value ? 'Copied' : 'Copy'}</span></button><button className={isSaved ? 'saved' : ''} onClick={() => toggleSaved(item.value)} aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}>{isSaved ? <Check size={14}/> : <Bookmark size={14}/>}<span>{isSaved ? 'Saved' : 'Watchlist'}</span></button></div></div>
        </article>;
      })}{filtered.length === 0 && <div className="report-empty"><ShieldAlert size={22}/><b>No indicators match</b><span>Try another search, change the filters, or reset the view.</span></div>}</div>
      <div className="ioc-footnote"><ShieldCheck size={14}/> Watchlist selections exist only in this page session and are not saved to your account.</div>
    </div>
  </section>;
}

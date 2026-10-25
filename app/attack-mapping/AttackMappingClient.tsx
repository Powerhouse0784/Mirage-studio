'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, Crosshair, Filter, Search, ShieldAlert, Target } from 'lucide-react';

export type MappingEvent = { id: string; investigationId: string; investigationTitle: string; scenario: string; seq: number; title: string; detail: string; severity: string; node: string | null; occurredAt: string };
type CaseRow = { id: string; title: string; scenario: string; eventCount: number; status: string };
type Technique = { id: string; name: string; tactic: string; tacticId: string; scenarios: string[]; rationale: string; keywords: string[] };
const techniques: Technique[] = [
  { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', tacticId: 'TA0001', scenarios: ['Web exploit'], rationale: 'The scenario models an exposed web service as a possible initial foothold.', keywords: ['exploit','web','http','application','gateway','payload'] },
  { id: 'T1566.002', name: 'Spearphishing Link', tactic: 'Initial Access', tacticId: 'TA0001', scenarios: ['Phished insider'], rationale: 'The scenario starts with a simulated phishing-led compromise.', keywords: ['phish','email','link','click','mail'] },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Initial Access', tacticId: 'TA0001', scenarios: ['Phished insider','Stolen credentials'], rationale: 'The scenario models misuse of an existing or compromised account.', keywords: ['credential','account','login','auth','password','session'] },
  { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', tacticId: 'TA0006', scenarios: ['Stolen credentials'], rationale: 'Credential testing is a scenario-level analogue; event evidence is needed to establish repeated guessing.', keywords: ['brute','guess','password','credential','login','auth'] },
  { id: 'T1083', name: 'File and Directory Discovery', tactic: 'Discovery', tacticId: 'TA0007', scenarios: ['Ransomware probe'], rationale: 'The scenario includes simulated discovery of file shares and related assets.', keywords: ['file','directory','share','enumerat','discover','list'] },
  { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', tacticId: 'TA0040', scenarios: ['Ransomware probe'], rationale: 'The scenario represents ransomware-related impact in a controlled decoy environment; do not infer encryption from a probe alone.', keywords: ['encrypt','ransom','backup','impact','vault'] },
  { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', tacticId: 'TA0008', scenarios: ['Phished insider','Stolen credentials'], rationale: 'Internal movement is represented by transitions between simulated systems.', keywords: ['ssh','remote','lateral','service','workstation','file share'] },
  { id: 'T1552', name: 'Unsecured Credentials', tactic: 'Credential Access', tacticId: 'TA0006', scenarios: ['Web exploit','Phished insider','Stolen credentials'], rationale: 'Decoy credentials may attract access attempts; a decoy asset alone does not confirm credential theft.', keywords: ['credential','secret','key','token','password'] },
];
const tactics = ['All tactics', ...Array.from(new Set(techniques.map(t => t.tactic)))];
const dateLabel = (value: string) => new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
function mapEvent(event: MappingEvent) {
  const candidates = techniques.filter(t => t.scenarios.includes(event.scenario));
  const text = `${event.title} ${event.detail} ${event.node ?? ''}`.toLowerCase();
  const matched = candidates.filter(t => t.keywords.some(keyword => text.includes(keyword)));
  return matched.length ? matched : candidates.slice(0, 2);
}
export default function AttackMappingClient({ events, cases }: { events: MappingEvent[]; cases: CaseRow[] }) {
  const [scenario, setScenario] = useState('ALL');
  const [tactic, setTactic] = useState('All tactics');
  const [query, setQuery] = useState('');
  const mappedEvents = useMemo(() => events.map(event => ({ ...event, mappings: mapEvent(event) })), [events]);
  const visibleEvents = useMemo(() => mappedEvents.filter(event => {
    const q = query.trim().toLowerCase();
    return (scenario === 'ALL' || event.scenario === scenario) && (!q || [event.title, event.detail, event.node, event.investigationTitle, event.scenario].some(value => String(value ?? '').toLowerCase().includes(q))) && (tactic === 'All tactics' || event.mappings.some(mapping => mapping.tactic === tactic));
  }), [mappedEvents, query, scenario, tactic]);
  const relevantTechniques = useMemo(() => techniques.filter(t => (scenario === 'ALL' || t.scenarios.includes(scenario)) && (tactic === 'All tactics' || t.tactic === tactic)), [scenario, tactic]);
  const activeTechniqueCount = new Set(visibleEvents.flatMap(event => event.mappings.map(mapping => mapping.id))).size;
  const tacticCounts = tactics.slice(1).map(name => ({ name, count: new Set(mappedEvents.filter(event => event.mappings.some(m => m.tactic === name)).map(event => event.id)).size }));
  return <>
    <section className="report-kpis attack-kpis">
      <article><span><Crosshair size={17}/></span><small>CANDIDATE TECHNIQUES</small><strong>{relevantTechniques.length}</strong><p>Scenario-linked ATT&amp;CK techniques</p></article>
      <article><span><ShieldAlert size={17}/></span><small>EVENTS IN VIEW</small><strong>{visibleEvents.length}</strong><p>Recorded simulation events</p></article>
      <article><span><Target size={17}/></span><small>TECHNIQUES WITH EVIDENCE</small><strong>{activeTechniqueCount}</strong><p>Techniques associated with visible events</p></article>
      <article><span><CheckCircle2 size={17}/></span><small>CASES REVIEWED</small><strong>{cases.filter(c => c.eventCount > 0).length}</strong><p>Cases with recorded event evidence</p></article>
    </section>
    <section className="report-panel attack-framework-panel">
      <div className="report-panel-title"><Target size={17}/><div><h2>ATT&amp;CK technique library</h2><p>Scenario-driven learning map · Enterprise technique IDs</p></div></div>
      <div className="attack-filters"><label className="alert-search"><Search size={16}/><input aria-label="Search mapping evidence" placeholder="Search events, assets, cases…" value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label="Filter scenario" value={scenario} onChange={e => setScenario(e.target.value)}><option value="ALL">All scenarios</option>{Array.from(new Set(cases.map(c => c.scenario))).map(s => <option key={s} value={s}>{s}</option>)}</select><select aria-label="Filter tactic" value={tactic} onChange={e => setTactic(e.target.value)}>{tactics.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
      <div className="attack-tactic-strip">{tacticCounts.map(item => <button type="button" key={item.name} className={`attack-tactic-chip ${tactic === item.name ? 'selected' : ''}`} onClick={() => setTactic(tactic === item.name ? 'All tactics' : item.name)}><span>{item.name}</span><b>{item.count}</b></button>)}</div>
      <div className="attack-technique-grid">{relevantTechniques.map(technique => {
        const evidenceCount = new Set(visibleEvents.filter(event => event.mappings.some(m => m.id === technique.id)).map(event => event.id)).size;
        return <article className="attack-technique-card" key={technique.id}><div className="attack-technique-top"><span>{technique.tactic}</span><b>{technique.tacticId}</b></div><div className="attack-technique-id">{technique.id}</div><h3>{technique.name}</h3><p>{technique.rationale}</p><div className="attack-technique-bottom"><span className={evidenceCount ? 'has-evidence' : ''}>{evidenceCount} linked event{evidenceCount === 1 ? '' : 's'}</span><small>{technique.scenarios.join(' · ')}</small></div></article>;
      })}</div>
    </section>
    <section className="report-panel attack-evidence-panel">
      <div className="report-panel-title"><Filter size={17}/><div><h2>Event evidence explorer</h2><p>{visibleEvents.length} events match the current filters. Candidate mappings are derived from scenario context and event text.</p></div></div>
      {visibleEvents.length ? <div className="attack-evidence-list">{visibleEvents.map(event => <article className="attack-evidence-row" key={event.id}><div className="attack-evidence-marker"/><div className="attack-evidence-main"><div className="attack-evidence-title"><b>{event.title}</b><span className={`report-severity sev-${event.severity.toLowerCase()}`}>{event.severity}</span></div><p>{event.detail}</p><div className="attack-evidence-meta"><span>{dateLabel(event.occurredAt)}</span>{event.node && <span>Asset: {event.node}</span>}<span>{event.scenario}</span></div><div className="attack-event-mappings">{event.mappings.length ? event.mappings.map(mapping => <span key={mapping.id}><b>{mapping.id}</b> {mapping.name}</span>) : <span>No candidate technique mapped — review manually</span>}</div></div><Link className="alert-open-link" href={`/investigations/${event.investigationId}`} aria-label={`Open case ${event.investigationTitle}`}>Open case <ArrowUpRight size={14}/></Link></article>)}</div> : <div className="report-empty"><CheckCircle2 size={22}/><b>No matching event evidence</b><span>Try another scenario or tactic. Run a simulation to create more recorded evidence.</span></div>}
    </section>
  </>;
}
